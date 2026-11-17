"use client";

import { useEffect, useRef, useState } from "react";
import CopyButton from "./CopyButton";
import { requireLogin } from "@/lib/auth-modal";
import { packStats } from "@/lib/export-content";
import { FREE_FAVORITE_LIMIT } from "@/lib/favorites";
import { track } from "@/lib/track";

type PayPlan = {
  key: string;
  name: string;
  money: string;
  days?: number | string;
};

type Me = {
  user: { email: string; proUntil: string | null } | null;
  pro: boolean;
  plans: PayPlan[];
  payTest: (PayPlan & { revable?: boolean }) | null;
};

const UI = {
  zh: {
    title: "把站里的材料，整包带走",
    sub: (s: { concepts: number; prompts: number; skills: number }) =>
      `${s.concepts} 条概念、${s.prompts} 条提示词、${s.skills} 个技能。付完立刻下载。`,
    titleCopy: "免费复制次数用完了",
    subCopy: "开通后不限次。正在看的内容，也可以整包带走。",
    titleFav: "免费收藏到上限了",
    subFav: `免费只能存 ${FREE_FAVORITE_LIMIT} 条。开通后不设上限，还能同步到其他设备。`,
    benefits: [
      "一份 Markdown：概念、提示词、技能、设计参考、路径",
      "SKILL.md 丢进 Cursor / Claude Code，少重复背景",
      "提示词不限次复制，收藏不设上限",
      "有效期内重新下载，就是最新版",
    ],
    monthly: "月卡",
    yearly: "年卡",
    lifetime: "终身",
    perMonth: "/ 月",
    once: "一次买断",
    tryMonth: "先用一个月",
    noRenew: "以后不用再续",
    perMonthEq: (n: string) => `≈ ¥${n} / 月`,
    saveVsMonth: (n: number) => `比月付省 ¥${n}`,
    best: "最划算",
    cta: "微信支付开通",
    payCta: (money: string) => `微信支付 ¥${money}`,
    later: "继续免费阅读",
    done: "完成",
    back: "返回",
    payAmount: "支付金额",
    scan: "微信扫码支付",
    scanHint: "付完自动开通，不用刷新",
    errWxOff: "微信支付暂不可用，请稍后再试",
    errGeneric: "出错了，请重试",
    proActive: "你已是 PRO 会员",
    proUntil: "有效期至",
    proLifetime: "终身有效",
    dlLibrary: "下载完整离线包",
    dlKit: "下载 SKILL.md",
    fineprint: "站内阅读免费 · 到期不自动续费 · 付完不用刷新",
    linkTerms: "用户协议",
    linkPrivacy: "隐私政策",
    linkRefunds: "退款与售后",
    manualTitle: "手机上这样开通",
    manualSub: "手机扫不了自己屏幕上的码，所以这一单由我手动给你开。三步，订单号是唯一凭据。",
    manualOrder: "订单号",
    manualCopy: "复制订单号",
    manualStep1: "加微信，把订单号发我",
    manualStep1Body: "长按二维码识别添加，验证消息里就填这串数字。",
    manualStep2: "按套餐价转账",
    manualStep3: "我核对到账后开通",
    manualStep3Body: "一般几个小时，最晚不超过 24 小时；开通后这个窗口自己会变成已开通，不用你回来刷新。",
    manualWait: "已经下过单了，还在等你把订单号发我。",
    manualCancel: "这单不要了",
    manualPc: "或者用电脑自己扫码付",
    manualPcBody: "电脑打开下面的网址，登录后点「开通 PRO」，手机扫屏幕上的码，付完立刻到账。",
    copySite: "复制网址",
    copied: "已复制",
    copyFail: "复制失败，请手动输入",
    testTitle: "支付验证单",
    testSub: "只给白名单账号用，1 分钱走完整链路",
    testName: "验证单",
    testDays: "1 天 PRO",
    testCta: "付 ¥0.01 验证",
    testCancel: "先不验证",
    testHint: "下单、扫码、回调、到账四步全走真的；这一单不计入付费统计。",
    testOpenWx: "在这台手机上打开微信付款",
    testRevoke: "撤销这次验证给的 PRO",
    testRevoked: "已撤销，这个号回到免费用户",
  },
  en: {
    title: "Take the library with you",
    sub: (s: { concepts: number; prompts: number; skills: number }) =>
      `${s.concepts} concepts, ${s.prompts} prompts, ${s.skills} skills. Download starts right after payment.`,
    titleCopy: "Free copies are used up",
    subCopy: "PRO has no copy limit. The page you're on comes with the pack.",
    titleFav: "Free saves are full",
    subFav: `Free accounts keep ${FREE_FAVORITE_LIMIT}. PRO has no cap, and syncs across devices.`,
    benefits: [
      "One Markdown file: concepts, prompts, skills, design refs, paths",
      "SKILL.md for Cursor / Claude Code — less repeated briefing",
      "Unlimited prompt copies and favorites",
      "Re-download anytime while the plan is active",
    ],
    monthly: "Monthly",
    yearly: "Yearly",
    lifetime: "Lifetime",
    perMonth: "/ mo",
    once: "one-time",
    tryMonth: "Try one month",
    noRenew: "No renewals",
    perMonthEq: (n: string) => `≈ ¥${n} / mo`,
    saveVsMonth: (n: number) => `Save ¥${n} vs monthly`,
    best: "Best value",
    cta: "Get PRO",
    payCta: (money: string) => `Pay ¥${money} with WeChat`,
    later: "Keep reading for free",
    done: "Done",
    back: "Back",
    payAmount: "Amount",
    scan: "Scan with WeChat",
    scanHint: "Activates automatically once paid",
    errWxOff: "WeChat Pay is unavailable right now, try again later",
    errGeneric: "Something went wrong, try again",
    proActive: "You're already a PRO member",
    proUntil: "Valid until",
    proLifetime: "Lifetime",
    dlLibrary: "Download the full pack",
    dlKit: "Download SKILL.md",
    fineprint: "Reading stays free · no auto-renew · activates when paid",
    linkTerms: "Terms",
    linkPrivacy: "Privacy",
    linkRefunds: "Refunds",
    manualTitle: "Activating on your phone",
    manualSub: "A phone can't scan the code on its own screen, so I switch this one on by hand. Three steps, and the order number is the only proof.",
    manualOrder: "Order number",
    manualCopy: "Copy order number",
    manualStep1: "Add me on WeChat and send the number",
    manualStep1Body: "Long-press the code below to add me; put the order number in the request message.",
    manualStep2: "Transfer the plan price",
    manualStep3: "I check the money and switch you on",
    manualStep3Body: "Usually within a few hours, always inside 24. This window flips to active on its own — no need to come back and refresh.",
    manualWait: "Order placed. It waits here until you send me the number.",
    manualCancel: "Drop this order",
    manualPc: "Or pay by scanning on a computer",
    manualPcBody: "Open the address below on a computer, sign in, click Get PRO, then scan the screen with your phone.",
    copySite: "Copy address",
    copied: "Copied",
    copyFail: "Copy failed, type it in",
    testTitle: "Payment smoke test",
    testSub: "Whitelisted accounts only, 1 cent through the real flow",
    testName: "Test order",
    testDays: "1 day PRO",
    testCta: "Pay ¥0.01 to test",
    testCancel: "Not now",
    testHint: "Order, scan, callback and settle all run for real. This order stays out of paid stats.",
    testOpenWx: "Open WeChat Pay on this device",
    testRevoke: "Revoke the PRO this test granted",
    testRevoked: "Revoked — this account is back on the free plan",
  },
};

const STATS = { zh: packStats("zh"), en: packStats("en") };

function fmtMoney(m: string): string {
  return m.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

/** 年卡相对「月卡 × 12」的差价。价格改了这里跟着变，不写死省多少。 */
function yearlyDeal(plans: PayPlan[]): { perMonth: string; save: number } | null {
  const monthly = plans.find((p) => p.key === "monthly");
  const yearly = plans.find((p) => p.key === "yearly");
  if (!monthly || !yearly) return null;
  const per = Number(yearly.money) / 12;
  const save = Math.round(Number(monthly.money) * 12 - Number(yearly.money));
  if (!(per > 0) || !(save > 0)) return null;
  return { perMonth: per.toFixed(1).replace(/\.0$/, ""), save };
}

function lifetimeShown(proUntil: string | null): boolean {
  return !!proUntil && proUntil.slice(0, 4) >= "2050";
}

export default function ProModal({
  locale,
  onClose,
  entry = "plans",
  initialPlan,
  reason,
}: {
  locale: "zh" | "en";
  onClose: () => void;
  /** test：白名单账号专用的验证单入口，不渲染三档套餐 */
  entry?: "plans" | "test";
  /** 从定价页带入的套餐，打开即选中 */
  initialPlan?: string;
  /** 哪一步把人推到这张卡前，用来改标题 */
  reason?: "copy" | "favorite";
}) {
  const U = UI[locale];
  const base = locale === "en" ? "/en" : "";
  const [me, setMe] = useState<Me | null>(null);
  const [step, setStep] = useState<"plans" | "qr" | "manual">("plans");
  const [planKey, setPlanKey] = useState(
    entry === "test" ? "test" : initialPlan ?? "yearly"
  );
  const [phone, setPhone] = useState(false);
  const [siteHost, setSiteHost] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [justPaid, setJustPaid] = useState(false);
  const [qr, setQr] = useState<{
    outTradeNo: string;
    dataUrl: string;
    codeUrl: string;
  } | null>(null);
  const [manual, setManual] = useState<{
    outTradeNo: string;
    money: string;
    name: string;
  } | null>(null);
  useEffect(() => {
    // 触屏设备扫不了自己屏幕上的码，付费改走「电脑下单 / 微信代开」两条出口
    setPhone(window.matchMedia("(hover: none)").matches);
    setSiteHost(window.location.host);
    const load = () =>
      fetch("/api/me")
        .then((r) => r.json())
        .then((d: Me) => setMe(d))
        .catch(() => {});
    load();
    // 登录弹窗登进来了要立刻重取套餐与 pro 状态，付款方式才选得对
    window.addEventListener("vh-me-changed", load);
    return () => window.removeEventListener("vh-me-changed", load);
  }, []);

  // 服务端没给 payTest（白名单没命中）时退回普通套餐弹窗，不做出错的死路
  const testMode = entry === "test" && !!me?.payTest;
  const plan: PayPlan | null = testMode
    ? me?.payTest ?? null
    : me?.plans.find((p) => p.key === planKey) ?? null;
  const shownPlans: PayPlan[] = testMode ? (plan ? [plan] : []) : me?.plans ?? [];

  async function startPay() {
    if (!plan) return;
    // 触屏设备上这张码没人能扫，所以改走人工开通：照样落一笔单，只是核销由我在微信里做
    if (phone && !testMode) {
      await startManual();
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/pay/wx/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: plan.key }),
      });
      if (!r.ok) {
        setErr(r.status === 503 ? U.errWxOff : U.errGeneric);
        return;
      }
      const d = await r.json();
      // 验证单不埋点：付费漏斗的数得只算真用户
      if (!testMode) track("order_create", { plan: plan.key, amount: plan.money });
      setQr({ outTradeNo: d.outTradeNo, dataUrl: d.qr, codeUrl: d.codeUrl });
      setStep("qr");
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function startManual() {
    if (!plan) return;
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/pay/manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: plan.key }),
      });
      if (!r.ok) {
        setErr(U.errGeneric);
        return;
      }
      const d = await r.json();
      track("manual_order_create", { plan: plan.key, amount: plan.money });
      setManual({ outTradeNo: d.outTradeNo, money: d.money, name: d.name });
      setStep("manual");
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function cancelManual() {
    if (!manual) return;
    setErr("");
    setBusy(true);
    try {
      await fetch(`/api/pay/manual?out_trade_no=${manual.outTradeNo}`, { method: "DELETE" });
      setManual(null);
      setStep("plans");
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  // 撤销只针对验证单给的那几天，真钱买的套餐不动
  async function revokeTest() {
    setErr("");
    setNote("");
    setBusy(true);
    try {
      const r = await fetch("/api/pro/revoke-test", { method: "POST" });
      if (!r.ok) {
        setErr(U.errGeneric);
        return;
      }
      setMe(await fetch("/api/me").then((x) => x.json()));
      setNote(U.testRevoked);
      window.dispatchEvent(new Event("vh-me-changed"));
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  // 回调可能比人慢，轮询时服务端会顺手主动查单，所以这里只认 paid
  useEffect(() => {
    if (step !== "qr" || !qr) return;
    let stop = false;
    const t = setInterval(async () => {
      try {
        const d = await fetch(`/api/pay/wx/status?out_trade_no=${qr.outTradeNo}`).then((x) =>
          x.json()
        );
        if (!d.paid || stop) return;
        stop = true;
        clearInterval(t);
        if (!testMode) track("pay_success", { plan: plan?.key ?? "", amount: plan?.money ?? "" });
        const me2 = await fetch("/api/me").then((x) => x.json());
        setMe(me2);
        setQr(null);
        setJustPaid(true);
        setStep("plans");
        window.dispatchEvent(new Event("vh-me-changed"));
      } catch {
        /* 下一轮再试 */
      }
    }, 3000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [step, qr]);

  // 人工核销完，这个窗口自己翻成已开通；用户不需要知道是谁点的确认
  useEffect(() => {
    if (step !== "manual" || !manual) return;
    let stop = false;
    const t = setInterval(async () => {
      try {
        const d = await fetch(`/api/pay/manual?out_trade_no=${manual.outTradeNo}`).then((x) =>
          x.json()
        );
        if (d.status !== "paid" || stop) return;
        stop = true;
        clearInterval(t);
        track("pay_success", { plan: plan?.key ?? "", amount: manual.money, via: "manual" });
        setMe(await fetch("/api/me").then((x) => x.json()));
        setManual(null);
        setJustPaid(true);
        setStep("plans");
        window.dispatchEvent(new Event("vh-me-changed"));
      } catch {
        /* 下一轮再试 */
      }
    }, 5000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [step, manual, plan, testMode]);

  const deal = yearlyDeal(shownPlans);
  const headline = testMode
    ? U.testTitle
    : reason === "copy"
      ? U.titleCopy
      : reason === "favorite"
        ? U.titleFav
        : U.title;
  const lede = testMode
    ? U.testSub
    : reason === "copy"
      ? U.subCopy
      : reason === "favorite"
        ? U.subFav
        : U.sub(STATS[locale]);

  if (me?.user && me.pro && (!testMode || justPaid)) {
    return (
      <Shell locale={locale} onClose={onClose}>
        <div className="rd-pro-ok">
          <p id="rd-pro-title">{U.proActive}</p>
          <p className="fineprint">
            {U.proUntil}{" "}
            {lifetimeShown(me.user.proUntil)
              ? U.proLifetime
              : me.user.proUntil?.slice(0, 10)}
          </p>
          <a className="rd-btn rd-btn-block" href={`/api/export?kind=library&locale=${locale}`}>
            {U.dlLibrary}
          </a>
          <a className="rd-btn-ghost rd-btn-block" href={`/api/export?kind=agent-kit&locale=${locale}`}>
            {U.dlKit}
          </a>
          <button type="button" className="rd-pro-later" onClick={onClose}>
            {U.done}
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell locale={locale} onClose={onClose}>
      {step === "plans" && (
        <>
          <div className="mark">✦</div>
          <h3 id="rd-pro-title">{headline}</h3>
          <p className="sub">{lede}</p>
          <div className="rd-plans">
            {shownPlans.map((p) => {
              const hot = !testMode && p.key === "yearly";
              const unit = testMode
                ? U.testDays
                : p.key === "yearly" && deal
                  ? U.perMonthEq(deal.perMonth)
                  : p.key === "lifetime"
                    ? U.once
                    : U.perMonth;
              const note = testMode
                ? ""
                : p.key === "yearly" && deal
                  ? U.saveVsMonth(deal.save)
                  : p.key === "monthly"
                    ? U.tryMonth
                    : p.key === "lifetime"
                      ? U.noRenew
                      : "";
              return (
                <button
                  type="button"
                  key={p.key}
                  className={`rd-plan${planKey === p.key ? " is-active" : ""}${hot ? " is-hot" : ""}`}
                  aria-pressed={planKey === p.key}
                  onClick={() => setPlanKey(p.key)}
                >
                  {hot ? <em className="rd-plan-hot">{U.best}</em> : null}
                  <span className="rd-plan-label">
                    {testMode
                      ? U.testName
                      : p.key === "yearly"
                        ? U.yearly
                        : p.key === "lifetime"
                          ? U.lifetime
                          : U.monthly}
                  </span>
                  <b>¥{fmtMoney(p.money)}</b>
                  <span className="rd-plan-unit">{unit}</span>
                  {note ? <span className="rd-plan-note">{note}</span> : null}
                </button>
              );
            })}
          </div>
          {testMode ? (
            <p className="fineprint">{U.testHint}</p>
          ) : (
            <ul>
              {U.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          {err && <p className="rd-pro-err">{err}</p>}
          {note && <p className="fineprint">{note}</p>}
          <button
            className="rd-btn rd-btn-block"
            disabled={busy}
            onClick={() => {
              setErr("");
              setNote("");
              requireLogin({ reason: "pro", onDone: () => void startPay() });
            }}
          >
            {testMode ? U.testCta : plan ? U.payCta(fmtMoney(plan.money)) : U.cta}
          </button>
          {testMode && me?.payTest?.revable && (
            <button
              className="rd-btn-ghost rd-btn-block"
              disabled={busy}
              onClick={revokeTest}
            >
              {U.testRevoke}
            </button>
          )}
          <button type="button" className="rd-pro-later" onClick={onClose}>
            {testMode ? U.testCancel : U.later}
          </button>
          <p className="fineprint rd-fine-links">
            {U.fineprint} ·{" "}
            <a href={`${base}/refunds`}>{U.linkRefunds}</a> ·{" "}
            <a href={`${base}/terms`}>{U.linkTerms}</a> ·{" "}
            <a href={`${base}/privacy`}>{U.linkPrivacy}</a>
          </p>
        </>
      )}

      {step === "qr" && qr && (
        <>
          <h3 id="rd-pro-title">{U.scan}</h3>
          {plan && (
            <p className="sub">
              {U.payAmount} <b className="rd-pay-amount">¥{fmtMoney(plan.money)}</b>
            </p>
          )}
          <div className="rd-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.dataUrl} alt={U.scan} width={220} height={220} />
          </div>
          <p className="fineprint">{U.scanHint}</p>
          {testMode && phone && (
            <button
              className="rd-btn rd-btn-block"
              onClick={() => {
                window.location.href = qr.codeUrl;
              }}
            >
              {U.testOpenWx}
            </button>
          )}
          <button
            className="rd-btn-ghost rd-btn-block"
            onClick={() => {
              setQr(null);
              setStep("plans");
            }}
          >
            {U.back}
          </button>
        </>
      )}

      {step === "manual" && manual && (
        <>
          <h3 id="rd-pro-title">{U.manualTitle}</h3>
          <p className="sub">
            {U.payAmount} <b className="rd-pay-amount">¥{fmtMoney(manual.money)}</b> · {manual.name}
          </p>
          <p className="fineprint">{U.manualSub}</p>

          <div className="rd-manual-order">
            <span>{U.manualOrder}</span>
            <b>{manual.outTradeNo}</b>
            <CopyButton
              className="rd-btn-ghost rd-manual-copy"
              text={manual.outTradeNo}
              label={U.manualCopy}
              copiedLabel={U.copied}
              failLabel={U.copyFail}
            />
          </div>

          <div className="rd-manual-steps">
            <div className="rd-manual-step">
              <span className="rd-manual-n">1</span>
              <div>
                <h4>{U.manualStep1}</h4>
                <p>{U.manualStep1Body}</p>
                <div className="rd-guide-qr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/wechat-qr.png"
                    alt={locale === "zh" ? "我的微信二维码" : "My WeChat QR"}
                    width={128}
                    height={128}
                    draggable={false}
                  />
                </div>
              </div>
            </div>
            <div className="rd-manual-step">
              <span className="rd-manual-n">2</span>
              <div>
                <h4>{U.manualStep2}</h4>
                <p>
                  ¥{fmtMoney(manual.money)} · {manual.name}
                </p>
              </div>
            </div>
            <div className="rd-manual-step">
              <span className="rd-manual-n">3</span>
              <div>
                <h4>{U.manualStep3}</h4>
                <p>{U.manualStep3Body}</p>
              </div>
            </div>
          </div>

          {err && <p className="rd-pro-err">{err}</p>}

          <div className="rd-guide-item">
            <h4>{U.manualPc}</h4>
            <p>
              {U.manualPcBody}
              <b> {siteHost}</b>
            </p>
            <CopyButton
              className="rd-btn-ghost rd-guide-copy"
              text={`https://${siteHost}`}
              label={U.copySite}
              copiedLabel={U.copied}
              failLabel={U.copyFail}
            />
          </div>

          <button
            className="rd-btn-ghost rd-btn-block"
            disabled={busy}
            onClick={cancelManual}
          >
            {U.manualCancel}
          </button>
        </>
      )}
    </Shell>
  );
}

function Shell({
  locale,
  onClose,
  children,
}: {
  locale: "zh" | "en";
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  return (
    <div className="rd-overlay" onClick={onClose}>
      <div
        className="rd-pro"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rd-pro-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close"
          onClick={onClose}
          aria-label={locale === "zh" ? "关闭" : "Close"}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
