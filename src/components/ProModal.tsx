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
    title: "开通 PRO，下载完整离线包",
    sub: (s: { concepts: number; prompts: number; skills: number }) =>
      `含 ${s.concepts} 条概念、${s.prompts} 条提示词、${s.skills} 个技能。支付成功后即可下载。`,
    titleCopy: "免费复制次数已用完",
    subCopy: "开通 PRO 后可无限复制，并下载完整离线包。",
    titleFav: "免费收藏已达上限",
    subFav: `免费账号最多收藏 ${FREE_FAVORITE_LIMIT} 条。开通后无上限，并支持跨设备同步。`,
    benefits: [
      "完整 Markdown 离线包：概念、提示词、技能、设计参考与路径",
      "SKILL.md 可导入 Cursor / Claude Code，减少重复说明",
      "提示词无限次复制，收藏无上限",
      "有效期内可随时重新下载最新版本",
    ],
    monthly: "月付",
    yearly: "年付",
    lifetime: "终身",
    perMonth: "/ 月",
    once: "一次性购买",
    tryMonth: "按月订阅",
    noRenew: "无需续费",
    perMonthEq: (n: string) => `约 ¥${n} / 月`,
    saveVsMonth: (n: number) => `相比月付节省 ¥${n}`,
    best: "推荐",
    cta: "微信支付开通",
    payCta: (money: string) => `微信支付 ¥${money}`,
    later: "继续免费阅读",
    done: "完成",
    back: "返回",
    payAmount: "支付金额",
    scan: "微信扫码支付",
    scanHint: "支付成功后自动开通，无需刷新页面",
    errWxOff: "微信支付暂不可用，请稍后再试",
    errGeneric: "出错了，请重试",
    proActive: "你已是 PRO 会员",
    proUntil: "有效期至",
    proLifetime: "终身有效",
    dlLibrary: "下载完整离线包",
    dlKit: "下载 SKILL.md",
    fineprint: "站内阅读免费 · 到期不自动续费 · 支付成功后自动开通",
    linkTerms: "用户协议",
    linkPrivacy: "隐私政策",
    linkRefunds: "退款与售后",
    manualTitle: "在手机上开通",
    manualSub: "手机无法扫描本机屏幕上的付款码，该订单将由人工开通。请按以下三步操作，订单号为唯一凭证。",
    manualOrder: "订单号",
    manualCopy: "复制订单号",
    manualStep1: "添加微信，并发送订单号",
    manualStep1Body: "长按下方二维码添加好友，验证信息中填写订单号。",
    manualStep2: "按所选套餐金额转账",
    manualStep3: "确认到账后开通权益",
    manualStep3Body: "通常数小时内完成，最晚不超过 24 小时；开通后本窗口会自动更新，无需返回刷新。",
    manualWait: "订单已创建，请将订单号发送至微信以完成开通。",
    manualCancel: "取消此订单",
    manualPc: "或在电脑上扫码支付",
    manualPcBody: "在电脑打开下方网址，登录后点击「开通 PRO」，用手机扫描屏幕上的付款码即可即时到账。",
    copySite: "复制网址",
    copied: "已复制",
    copyFail: "复制失败，请手动输入",
    testTitle: "支付验证单",
    testSub: "仅限白名单账号，¥0.01 走完整支付流程",
    testName: "验证单",
    testDays: "1 天 PRO",
    testCta: "支付 ¥0.01 验证",
    testCancel: "暂不验证",
    testHint: "下单、扫码、回调与到账均为真实流程；该订单不计入付费统计。",
    testOpenWx: "在本机打开微信付款",
    testRevoke: "撤销本次验证开通的 PRO",
    testRevoked: "已撤销，该账号已恢复为免费用户",
  },
  en: {
    title: "Get PRO and download the full pack",
    sub: (s: { concepts: number; prompts: number; skills: number }) =>
      `${s.concepts} concepts, ${s.prompts} prompts, ${s.skills} skills. Download after payment.`,
    titleCopy: "Free copy limit reached",
    subCopy: "PRO unlocks unlimited copies and the full offline pack.",
    titleFav: "Free favorites limit reached",
    subFav: `Free accounts keep up to ${FREE_FAVORITE_LIMIT}. PRO has no limit and syncs across devices.`,
    benefits: [
      "Full Markdown offline pack: concepts, prompts, skills, design refs, and paths",
      "Import SKILL.md into Cursor / Claude Code to reduce repeated briefing",
      "Unlimited prompt copies and favorites",
      "Re-download the latest version anytime while active",
    ],
    monthly: "Monthly",
    yearly: "Yearly",
    lifetime: "Lifetime",
    perMonth: "/ mo",
    once: "One-time purchase",
    tryMonth: "Billed monthly",
    noRenew: "No renewal needed",
    perMonthEq: (n: string) => `≈ ¥${n} / mo`,
    saveVsMonth: (n: number) => `Save ¥${n} vs monthly`,
    best: "Recommended",
    cta: "Get PRO",
    payCta: (money: string) => `Pay ¥${money} with WeChat`,
    later: "Continue reading for free",
    done: "Done",
    back: "Back",
    payAmount: "Amount",
    scan: "Scan with WeChat Pay",
    scanHint: "Activates automatically after payment — no refresh needed",
    errWxOff: "WeChat Pay is unavailable right now. Please try again later.",
    errGeneric: "Something went wrong. Please try again.",
    proActive: "You're already a PRO member",
    proUntil: "Valid until",
    proLifetime: "Lifetime",
    dlLibrary: "Download the full pack",
    dlKit: "Download SKILL.md",
    fineprint: "Reading stays free · no auto-renew · activates after payment",
    linkTerms: "Terms",
    linkPrivacy: "Privacy",
    linkRefunds: "Refunds",
    manualTitle: "Activate on your phone",
    manualSub: "A phone can't scan a QR code on its own screen, so this order is activated manually. Follow three steps; the order number is your only proof.",
    manualOrder: "Order number",
    manualCopy: "Copy order number",
    manualStep1: "Add WeChat and send the order number",
    manualStep1Body: "Long-press the code below to add the contact; put the order number in the request message.",
    manualStep2: "Transfer the plan amount",
    manualStep3: "We confirm payment and activate PRO",
    manualStep3Body: "Usually within a few hours, always within 24. This window updates automatically — no need to refresh.",
    manualWait: "Order placed. Send the order number on WeChat to finish activation.",
    manualCancel: "Cancel this order",
    manualPc: "Or pay by scanning on a computer",
    manualPcBody: "Open the URL below on a computer, sign in, click Get PRO, then scan the on-screen code with your phone.",
    copySite: "Copy URL",
    copied: "Copied",
    copyFail: "Copy failed. Please enter it manually.",
    testTitle: "Payment test order",
    testSub: "Whitelisted accounts only — ¥0.01 through the real payment flow",
    testName: "Test order",
    testDays: "1 day of PRO",
    testCta: "Pay ¥0.01 to test",
    testCancel: "Not now",
    testHint: "Order, scan, callback, and settle all run for real. This order is excluded from paid stats.",
    testOpenWx: "Open WeChat Pay on this device",
    testRevoke: "Revoke the PRO from this test",
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
