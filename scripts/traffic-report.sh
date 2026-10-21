#!/usr/bin/env bash
# 一条命令出 BuildHub 的「真人口径」周报：nginx 去噪访客 + Umami 事件 + 产品自己的账号订单。
# 全程只读：不改线上配置、不在服务器落文件，SQL 走 stdin。
#
#   bash scripts/traffic-report.sh            # 最近 7 天
#   bash scripts/traffic-report.sh --days 30
#
# 环境变量：TRAFFIC_SSH_HOST（默认 smzs-server）、TRAFFIC_LOG（默认 /www/wwwlogs/buildhub.cn.log）
#
# 为什么要去噪：还没开始推广，Umami 的 PV 里九成以上是伪装成浏览器、还会执行 JS 的抓取器，
# 而自建 Umami 2.20 没有 bot filter 开关（website 表无相关字段、库里没有 setting 表），
# 它只按 UA 拦，拦不住伪装 UA。这里的判据：同一 IP 当天既请求 >=2 个不同文档页、
# 又拉过静态资源（纯扫描器只取 HTML、不拉资源），才算一次访客。
# 这条判据仍放得进来 Googlebot 这类渲染型爬虫和复用浏览器 UA 的脚本集群，所以真人下限
# 要看注册数和付费事件——那两个刷不出来。
set -euo pipefail

DAYS=7
while [ $# -gt 0 ]; do
  case "$1" in
    --days) DAYS="$2"; shift 2 ;;
    *) echo "未知参数：$1" >&2; exit 2 ;;
  esac
done

HOST="${TRAFFIC_SSH_HOST:-smzs-server}"
LOG="${TRAFFIC_LOG:-/www/wwwlogs/buildhub.cn.log}"
OUT="$(mktemp -t bh-traffic)"
trap 'rm -f "$OUT"' EXIT

ssh "$HOST" "bash -s -- '$LOG' '$DAYS'" <<'REMOTE' >"$OUT"
#!/bin/bash
L="$1"; DAYS="$2"

# 窗口内的日期串，nginx 日志用 21/Oct/2026 这种格式
NG=""
for i in $(seq 0 $((DAYS - 1))); do NG="$NG$(date -d "-$i day" +%d/%b/%Y)|"; done

# 1) nginx：真人访客（去噪）与全站访客，逐日
awk -v ng="$NG" '
BEGIN { n = split(ng, w, "|"); for (i = 1; i <= n; i++) if (w[i] != "") keep[w[i]] = 1 }
$9 == 200 {
  d = substr($4, 2, 11); if (!(d in keep)) next;
  ip = $1; k = d "|" ip;
  if (ip == "119.29.237.56" || ip ~ /^127\./) next;
  ua = $0; sub(/.*" "/, "", ua); sub(/"$/, "", ua);
  if (ua ~ /(bot|Bot|crawl|spider|Scrapy|curl|wget|python|Go-http|okhttp|Java|node-fetch|axios|HTTPie|Lynx|facebookexternalhit|Facebot|Headless|puppet|Puppet|Playwright|Selenium|Veskon|Amazonbot|CCBot|Dotbot|DataForSeo|PetalBot|Bytespider|GPTBot|ClaudeBot|Perplexity|omgilibot)/) next;
  if ($7 ~ /\/(_next\/static\/|fonts\/|favicon)|[.](css|js|woff2?|png|jpg|jpeg|svg|webp|gif|webmanifest|ico)$/) { asset[k] = 1; next }
  p2 = $7; sub(/\?.*$/, "", p2);
  if (p2 ~ /^\/api\// || p2 ~ /^\/wp/ || p2 ~ /[.]/ || $7 ~ /_rsc=/) next;
  if (!((k SUBSEP $7) in seen)) { seen[k SUBSEP $7] = 1; pages[k]++ }
  allpv[d]++; alluv[d "|" ip] = 1;
}
END {
  for (x in alluv) { split(x, p, "|"); auv[p[1]]++ }
  for (x in pages) if (asset[x] && pages[x] >= 2) {
    split(x, p, "|"); ruv[p[1]]++; rpv[p[1]] += pages[x]
  }
  for (d in allpv) printf "NG\t%s\t%d\t%d\t%d\t%d\n", d, ruv[d] + 0, rpv[d] + 0, auv[d], allpv[d];
  for (d in ruv) if (!(d in allpv)) printf "NG\t%s\t%d\t%d\t%d\t%d\n", d, ruv[d], rpv[d], 0, 0;
}' "$L"

# 2) Umami：日 PV/UV、漏斗事件、来路、地域。库内是 UTC，统一 +8 小时换成北京时间
# 每行第一列是标签，mysql 批处理模式自带 tab 分列（别用 CONCAT 塞 tab，会被转义成字面 \t）
docker exec -i umami-db sh -c 'mysql -N -B -uroot -p"$MYSQL_ROOT_PASSWORD" umami' <<SQL
SELECT 'UM_PV', d, pv, uv FROM (
  SELECT DATE_FORMAT(created_at + INTERVAL 8 HOUR,'%Y-%m-%d') d, COUNT(*) pv, COUNT(DISTINCT session_id) uv
  FROM website_event WHERE event_type = 1
    AND created_at + INTERVAL 8 HOUR >= CURDATE() - INTERVAL $((DAYS - 1)) DAY
  GROUP BY d) t;

SELECT 'UM_EV', event_name, c, lastd FROM (
  SELECT event_name, COUNT(*) c, MAX(DATE_FORMAT(created_at + INTERVAL 8 HOUR,'%Y-%m-%d')) lastd
  FROM website_event WHERE event_type <> 1 GROUP BY event_name) t;

SELECT 'UM_EV_ALL', COUNT(*) FROM website_event WHERE event_type <> 1;

SELECT 'UM_REF', src, pv, ss FROM (
  SELECT COALESCE(NULLIF(referrer_domain,''),'(direct)') src, COUNT(*) pv, COUNT(DISTINCT session_id) ss
  FROM website_event WHERE event_type = 1
    AND created_at + INTERVAL 8 HOUR >= CURDATE() - INTERVAL $((DAYS - 1)) DAY
  GROUP BY src ORDER BY pv DESC LIMIT 8) t;

SELECT 'UM_CC', cc, ss FROM (
  SELECT COALESCE(NULLIF(country,''),'?') cc, COUNT(*) ss
  FROM session WHERE created_at + INTERVAL 8 HOUR >= CURDATE() - INTERVAL $((DAYS - 1)) DAY
  GROUP BY cc ORDER BY ss DESC LIMIT 8) t;
SQL

# 3) 产品自己的表：注册与订单。SQLite 里存的也是 UTC，同样 +8 小时
docker exec -i -e DAYS="$DAYS" build-hub node - <<'JS'
const D = require("/app/node_modules/better-sqlite3");
const db = new D("/app/data/buildhub.db", { readonly: true });
const days = Number(process.env.DAYS);
const one = (s, ...a) => Object.values(db.prepare(s).get(...a))[0];
const out = [
  ["users_total", one("select count(*) n from users")],
  ["users_window", one("select count(*) n from users where datetime(created_at,'+8 hours') >= datetime('now','+8 hours',?)", "-" + (days - 1) + " days")],
  ["orders_total", one("select count(*) n from orders")],
  ["orders_not_selftest", one("select count(*) n from orders where plan <> ?", "test")],
  ["paid_not_selftest", one("select count(*) n from orders where plan <> ? and status = ?", "test", "paid")],
  ["pro_users", one("select count(*) n from users where pro_until is not null")],
];
for (const [k, v] of out) console.log("DB\t" + k + "\t" + v);
JS

# 4) 日期对照表：报告按北京时间 ISO 顺序输出
for i in $(seq 0 $((DAYS - 1))); do printf 'DATE\t%s\t%s\n' "$(date -d "-$i day" +%Y-%m-%d)" "$(date -d "-$i day" +%d/%b/%Y)"; done
REMOTE

LC_ALL=C awk -F'\t' '
$1 == "DATE" { ord[++N] = $2; key[$2] = $3; next }
$1 == "NG"   { ruv[$2] = $3; rpv[$2] = $4; auv[$2] = $5; apv[$2] = $6; next }
$1 == "UM_PV" { upv[$2] = $3; uuv[$2] = $4; next }
$1 == "UM_EV" { ev[$2] = $3; evlast[$2] = $4; nev++; next }
$1 == "UM_EV_ALL" { evAll = $2; next }
$1 == "UM_REF" { if (!($2 in ref)) { reford[++refn] = $2 } ref[$2] = $3 " 次 / " $4 " 人"; next }
$1 == "UM_CC"  { if (!($2 in cc)) { ccord[++ccn] = $2 } cc[$2] = $3; next }
$1 == "DB"     { db[$2] = $3; next }
END {
  printf "BuildHub 流量周报（北京时间）  %s → %s\n\n", ord[N], ord[1];
  print "日期        UmamiPV UmamiUV | 真人UV 真人PV 全站UV";
  for (i = 1; i <= N; i++) {
    iso = ord[i]; k = key[iso];
    if (!(k in ruv) && !(iso in upv)) continue;
    printf "%-11s %7s %7s | %6s %6s %6s\n", iso,
      (iso in upv) ? upv[iso] : "-", (iso in uuv) ? uuv[iso] : "-",
      (k in ruv) ? ruv[k] : "-", (k in ruv) ? rpv[k] : "-", (k in auv) ? auv[k] : "-";
  }
  print "";
  print "真人UV = 当天「浏览 >=2 个不同页 + 拉过静态资源 + UA 非 bot」的 IP 数。";
  print "它仍包含 Googlebot 这类会渲染的爬虫，也含你本人，只能当上限；真人下限看下面的注册与付费。";
  print "";
  print "付费漏斗事件:";
  if (nev == 0) printf "  0 条（上线至今累计 %s 条）—— 没人点到过升级/续费按钮。\n", (evAll != "" ? evAll : 0);
  else for (e in ev) printf "  %-14s %s 次（最后一次 %s）\n", e, ev[e], evlast[e];
  print ""
  print "来路域名:";
  if (refn == 0) print "  窗口内无记录";
  else for (i = 1; i <= refn; i++) { r = reford[i]; printf "  %-24s %s\n", r, ref[r] }
  print ""
  printf "新会话地域（按次数）:";
  if (ccn == 0) print "  窗口内无新会话";
  else { s = ""; for (i = 1; i <= ccn; i++) { c = ccord[i]; s = s " " c " " cc[c] } print s }
  print "";
  print "产品硬信号（机器刷不出来）:";
  printf "  注册账号 %s 个，窗口内新增 %s 个\n", db["users_total"], db["users_window"];
  printf "  订单 %s 笔；去掉自测 test 套餐后 %s 笔，其中已支付 %s 笔\n", db["orders_total"], db["orders_not_selftest"], db["paid_not_selftest"];
  printf "  PRO 用户 %s 个\n", db["pro_users"];
}' "$OUT"
