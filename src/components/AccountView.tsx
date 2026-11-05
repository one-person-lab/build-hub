"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProModal from "@/components/ProModal";
import { useFavoriteIndex } from "@/components/FavoritesView";
import { requireLogin, signOut } from "@/lib/auth-modal";
import { FREE_FAVORITE_LIMIT, useFavoriteSlugs, useMe } from "@/lib/favorites";
import { track } from "@/lib/track";

type Order = { plan: string; name: string; money: string; status: string; date: string };
type ManualOrder = {
  outTradeNo: string;
  account: string | null;
  name: string;
  money: string;
  createdAt: string;
};

const UI = {
  zh: {
    title: "账号",
    loginTitle: "登录 BuildHub",
    loginSub: "验证码将发送至你的邮箱，仅用于登录",
    login: "登录",
    wxUser: "微信用户",
    errGeneric: "出错了，请重试",
    proOn: "PRO 会员",
    proUntil: "有效期至",
    proLifetime: "终身有效",
    proFree: "免费用户",
    goPro: "开通 PRO",
    renew: "续费",
    logout: "退出登录",
    favBlock: "我的收藏",
    favUnit: "条",
    favAll: "查看全部",
    favEmpty: "还没有收藏，去条目右上角点 ★。",
    usage: "收藏",
    usageCta: "PRO 无限收藏",
    bill: "账单",
    billPlan: "项目",
    billMoney: "金额",
    billDate: "日期",
    billStatus: "状态",
    paid: "已支付",
    revoked: "已撤销",
    billEmpty: "还没有订单。",
    manualBlock: "待人工开通",
    manualEmpty: "没有等核销的手机端订单。",
    manualWho: "账号",
    manualWhen: "下单时间",
    manualSettle: "确认到账",
    manualDone: "已开通",
    assetsBlock: "PRO 下载",
    assetsSub: "离线包和 SKILL.md 随时可以重新下载，每次都是当前最新内容。",
    assetsPack: "下载完整离线包",
    assetsKit: "下载 SKILL.md",
    assetsView: "查看 PRO 内容",
  },
  en: {
    title: "Account",
    loginTitle: "Sign in to BuildHub",
    loginSub: "A code will be emailed to you, used only for sign-in",
    login: "Sign in",
    wxUser: "WeChat user",
    errGeneric: "Something went wrong, try again",
    proOn: "PRO member",
    proUntil: "Valid until",
    proLifetime: "Lifetime",
    proFree: "Free plan",
    goPro: "Go PRO",
    renew: "Renew",
    logout: "Sign out",
    favBlock: "My favorites",
    favUnit: "saved",
    favAll: "View all",
    favEmpty: "Nothing saved yet — tap the ★ on any entry.",
    usage: "Saves",
    usageCta: "Unlimited with PRO",
    bill: "Billing",
    billPlan: "Item",
    billMoney: "Amount",
    billDate: "Date",
    billStatus: "Status",
    paid: "Paid",
    revoked: "Revoked",
    billEmpty: "No orders yet.",
    manualBlock: "Waiting to activate",
    manualEmpty: "No phone orders to settle.",
    manualWho: "Account",
    manualWhen: "Placed",
    manualSettle: "Money received",
    assetsBlock: "PRO downloads",
    assetsSub: "Re-download the pack and SKILL.md anytime — the file always reflects the latest content.",
    assetsPack: "Download the full pack",
    assetsKit: "Download SKILL.md",
    assetsView: "See what is included",
    manualDone: "Activated",
  },
};

export default function AccountView({ locale }: { locale: "zh" | "en" }) {
  const U = UI[locale];
  const base = locale === "en" ? "/en" : "";
  const me = useMe();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showPro, setShowPro] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const slugs = useFavoriteSlugs();
  const [orders, setOrders] = useState<Order[]>([]);
  const [manuals, setManuals] = useState<ManualOrder[]>([]);
  const taps = useRef({ n: 0, at: 0 });
  const index = useFavoriteIndex(locale);
  const asked = useRef(false);
  const signedInOnce = useRef(false);

  // 隐藏入口：连点邮箱 5 次打开验证单。非白名单账号点了没有任何反应，不留线索
  function tapEmail() {
    const now = Date.now();
    taps.current =
      now - taps.current.at > 2000 ? { n: 1, at: now } : { n: taps.current.n + 1, at: now };
    if (taps.current.n < 5) return;
    taps.current = { n: 0, at: 0 };
    if (me?.payTest) setShowTest(true);
  }

  // 邮箱账号或微信昵称：换账号时要重拉订单
  const accountId = me?.user?.email ?? me?.user?.nickname ?? null;

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d: { orders: Order[] }) => setOrders(d.orders ?? []))
      .catch(() => {});
  }, [accountId]);

  // 手机端人工开通的单只有站长看得到；别人访问这个接口直接 404
  useEffect(() => {
    if (!me?.payTest) return;
    fetch("/api/pro/manual")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d: { orders: ManualOrder[] }) => setManuals(d.orders ?? []))
      .catch(() => {});
  }, [me?.payTest]);

  async function settleManual(outTradeNo: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/pro/manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ out_trade_no: outTradeNo }),
      });
      if (!r.ok) {
        setErr(U.errGeneric);
        return;
      }
      track("manual_settled", { order: outTradeNo });
      setManuals((list) => list.filter((o) => o.outTradeNo !== outTradeNo));
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  // 账号页未登录就是登录场景，直接把统一登录弹窗顶上来，不再铺一张内嵌表单
  // 退出过的人不再被按回登录框
  useEffect(() => {
    if (!me || me.user || asked.current || signedInOnce.current) return;
    asked.current = true;
    requireLogin();
  }, [me]);

  useEffect(() => {
    if (me?.user) signedInOnce.current = true;
  }, [me]);

  async function logout() {
    await signOut();
    setOrders([]);
  }

  const proUntilText =
    me?.user?.proUntil && me.user.proUntil.slice(0, 4) >= "2050"
      ? U.proLifetime
      : me?.user?.proUntil?.slice(0, 10);

  const preview = useMemo(
    () => slugs.map((s) => index.get(s)).filter(Boolean).slice(0, 3),
    [slugs, index],
  );

  return (
    <main className="rd-account">
      <h1>{U.title}</h1>
      {me === null ? null : !me.user ? (
        <section className="rd-card acct-login">
          <h2>{U.loginTitle}</h2>
          <p className="sub">{U.loginSub}</p>
          <button className="rd-btn rd-btn-block" onClick={() => requireLogin()}>
            {U.login}
          </button>
        </section>
      ) : (
        <>
          <section className="acct-idbar">
            <div>
              <p className="acct-mail" onClick={tapEmail}>
                {me.user.email ?? me.user.nickname ?? U.wxUser}
              </p>
              <p className={`acct-plan${me.pro ? " is-pro" : ""}`}>
                {me.pro
                  ? `✦ ${U.proOn}${proUntilText ? ` · ${U.proUntil} ${proUntilText}` : ""}`
                  : U.proFree}
              </p>
            </div>
            {!me.pro ? (
              <button
                className="rd-btn"
                onClick={() => {
                  track("go_pro_click", { from: "account" });
                  setShowPro(true);
                }}
              >
                {U.goPro}
              </button>
            ) : (
              proUntilText !== U.proLifetime && (
                <button
                  className="rd-btn"
                  onClick={() => {
                    track("renew_click", { from: "account" });
                    setShowPro(true);
                  }}
                >
                  {U.renew}
                </button>
              )
            )}
          </section>

          {!me.pro && (
            <section className="acct-usage">
              <span className="acct-usage-label">
                {U.usage}
                <b>{slugs.length}</b>
                <span className="acct-usage-cap"> / {FREE_FAVORITE_LIMIT}</span>
              </span>
              <button type="button" className="acct-usage-cta" onClick={() => setShowPro(true)}>
                {U.usageCta} →
              </button>
              <span className="acct-usage-bar" aria-hidden>
                <i
                  style={{ width: `${Math.min(100, (slugs.length / FREE_FAVORITE_LIMIT) * 100)}%` }}
                />
              </span>
            </section>
          )}

          {me.pro && (
            <section className="acct-block">
              <header className="acct-block-head">
                <h2>{U.assetsBlock}</h2>
                <a href={`${base}/pro`}>{U.assetsView} →</a>
              </header>
              <p className="acct-assets-sub">{U.assetsSub}</p>
              <div className="acct-assets-actions">
                <a className="rd-btn" href={`/api/export?kind=library&locale=${locale}`}>
                  {U.assetsPack}
                </a>
                <a className="rd-btn-ghost" href={`/api/export?kind=agent-kit&locale=${locale}`}>
                  {U.assetsKit}
                </a>
              </div>
            </section>
          )}

          <section className="acct-block">
            <header className="acct-block-head">
              <h2>
                {U.favBlock} · {slugs.length} {U.favUnit}
              </h2>
              <a href={`${base}/favorites`}>
                {U.favAll} →
              </a>
            </header>
            {preview.length === 0 ? (
              <p className="acct-empty">{U.favEmpty}</p>
            ) : (
              <ul className="acct-rows">
                {preview.map((e) => (
                  <li key={e!.slug}>
                    <a href={e!.href}>
                      <span className="acct-row-name">{e!.name}</span>
                      {e!.en && <span className="acct-row-en">{e!.en}</span>}
                      <span className="acct-row-zone">{e!.zone}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {me?.payTest && (
            <section className="acct-block">
              <header className="acct-block-head">
                <h2>{U.manualBlock}</h2>
              </header>
              {manuals.length === 0 ? (
                <p className="acct-empty">{U.manualEmpty}</p>
              ) : (
                <table className="acct-bill">
                  <thead>
                    <tr>
                      <th>{U.manualWho}</th>
                      <th>{U.billPlan}</th>
                      <th>{U.billMoney}</th>
                      <th>{U.manualWhen}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {manuals.map((o) => (
                      <tr key={o.outTradeNo}>
                        <td>{o.account ?? "—"}</td>
                        <td>{o.name.replace("BuildHub ", "")}</td>
                        <td>¥{o.money}</td>
                        <td>{o.createdAt.slice(5, 16)}</td>
                        <td>
                          <button
                            type="button"
                            className="acct-settle"
                            disabled={busy}
                            onClick={() => settleManual(o.outTradeNo)}
                          >
                            {U.manualSettle}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {err && <p className="rd-pro-err">{err}</p>}
            </section>
          )}

          <section className="acct-block">
            <header className="acct-block-head">
              <h2>{U.bill}</h2>
            </header>
            {orders.length === 0 ? (
              <p className="acct-empty">{U.billEmpty}</p>
            ) : (
              <table className="acct-bill">
                <thead>
                  <tr>
                    <th>{U.billPlan}</th>
                    <th>{U.billMoney}</th>
                    <th>{U.billDate}</th>
                    <th>{U.billStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={`${o.plan}-${o.date}-${o.money}`}>
                      <td>{locale === "en" ? "BuildHub PRO" : o.name.replace("BuildHub ", "")}</td>
                      <td>¥{o.money}</td>
                      <td>{o.date}</td>
                      <td className={o.status === "paid" ? "is-paid" : "is-revoked"}>
                        {o.status === "paid" ? U.paid : U.revoked}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <div className="acct-foot">
            <button type="button" onClick={logout}>
              {U.logout}
            </button>
          </div>
        </>
      )}
      {showPro && <ProModal locale={locale} onClose={() => setShowPro(false)} />}
      {showTest && (
        <ProModal locale={locale} entry="test" onClose={() => setShowTest(false)} />
      )}
    </main>
  );
}
