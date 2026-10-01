"use client";

import { useEffect, useRef, useState } from "react";
import CopyButton from "./CopyButton";
import { track } from "@/lib/track";

type Me = {
  user: { email: string; proUntil: string | null } | null;
  pro: boolean;
  plans: {
    key: string;
    name: string;
    money: string;
    listPrice: string | null;
    days: number | string;
  }[];
};

const UI = {
  zh: {
    title: "BuildHub PRO",
    sub: "为认真做产品的人",
    benefits: ["无限收藏与跨设备同步", "图鉴视图与 Markdown 导出", "新条目抢先看与终身更新（买断）"],
    monthly: "月卡",
    yearly: "年卡",
    lifetime: "终身买断",
    perMonth: "/ 月",
    perYear: "/ 年",
    once: "一次付费",
    limited: "限时",
    cta: "开通 PRO",
    back: "返回",
    loginTitle: "登录后继续",
    loginSub: "验证码将发送至你的邮箱，仅用于登录",
    emailPh: "邮箱地址",
    sendCode: "获取验证码",
    resendIn: "后重发",
    resend: "重新获取",
    codePh: "6 位验证码",
    toPay: "去支付",
    payAmount: "支付金额",
    scan: "微信扫码支付",
    scanHint: "支付成功后自动开通，无需刷新",
    errWxOff: "微信支付暂不可用，请稍后再试",
    errGeneric: "出错了，请重试",
    errCode: "验证码错误或已过期",
    errMail: "邮件发送失败，请稍后重试",
    errTooFast: "发送太快，稍后再试",
    proActive: "你已是 PRO 会员",
    proUntil: "有效期至",
    proLifetime: "终身有效",
    fineprint: "基础浏览永远免费",
    linkTerms: "用户协议",
    linkPrivacy: "隐私政策",
    linkRefunds: "退款与售后",
    guideTitle: "手机上还不能直接付款",
    guideBody: "付款二维码要用另一台设备来扫，所以在自己手机上扫不了。手机端直接付款正在审核，通过后这里立刻可用。",
    guideWay1: "用电脑付款",
    guideWay1Body: "在电脑上打开下面的网址，登录后点「开通 PRO」，用手机扫电脑屏幕就能付。",
    copySite: "复制网址",
    copied: "已复制",
    copyFail: "复制失败，请手动输入",
    guideWay2: "或加我微信代开",
    guideWay2Body: "先截图，再在微信「扫一扫 → 相册」里识别这张码添加我，备注 PRO，我把开通方式发给你。",
  },
  en: {
    title: "BuildHub PRO",
    sub: "For people who ship seriously",
    benefits: [
      "Unlimited favorites & cross-device sync",
      "Index view & Markdown export",
      "Early access · lifetime updates (one-time plan)",
    ],
    monthly: "Monthly",
    yearly: "Yearly",
    lifetime: "Lifetime",
    perMonth: "/ mo",
    perYear: "/ yr",
    once: "one-time",
    limited: "LIMITED",
    cta: "Go PRO",
    back: "Back",
    loginTitle: "Sign in to continue",
    loginSub: "A code will be emailed to you, used only for sign-in",
    emailPh: "Email address",
    sendCode: "Send code",
    resendIn: " to resend",
    resend: "Resend",
    codePh: "6-digit code",
    toPay: "Continue",
    payAmount: "Amount",
    scan: "Scan with WeChat",
    scanHint: "Activates automatically once paid",
    errWxOff: "WeChat Pay is unavailable right now, try again later",
    errGeneric: "Something went wrong, try again",
    errCode: "Wrong or expired code",
    errMail: "Failed to send email, try later",
    errTooFast: "Too fast, wait a minute",
    proActive: "You're already a PRO member",
    proUntil: "Valid until",
    proLifetime: "Lifetime",
    fineprint: "browsing stays free forever",
    linkTerms: "Terms",
    linkPrivacy: "Privacy",
    linkRefunds: "Refunds",
    guideTitle: "Paying on this phone isn't live yet",
    guideBody: "That QR code has to be scanned by another device, so it can't be scanned on the phone showing it. In-app mobile payment is under review and will work here as soon as it's approved.",
    guideWay1: "Pay on a computer",
    guideWay1Body: "Open the address below on a computer, sign in, click Go PRO, then scan the computer screen with your phone.",
    copySite: "Copy address",
    copied: "Copied",
    copyFail: "Copy failed, type it in",
    guideWay2: "Or ask me on WeChat",
    guideWay2Body: "Screenshot the code, then in WeChat use Scan → Album to add me. Mention PRO and I'll send the way to activate.",
  },
};

const FMT: Record<string, { label: keyof typeof UI.zh; unit: keyof typeof UI.zh }> = {
  monthly: { label: "perMonth", unit: "monthly" },
  yearly: { label: "perYear", unit: "yearly" },
  lifetime: { label: "once", unit: "lifetime" },
};

function fmtMoney(m: string): string {
  return m.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function lifetimeShown(proUntil: string | null): boolean {
  return !!proUntil && proUntil.slice(0, 4) >= "2050";
}

export default function ProModal({
  locale,
  onClose,
}: {
  locale: "zh" | "en";
  onClose: () => void;
}) {
  const U = UI[locale];
  const base = locale === "en" ? "/en" : "";
  const [me, setMe] = useState<Me | null>(null);
  const [step, setStep] = useState<"plans" | "login" | "qr" | "guide">("plans");
  const [planKey, setPlanKey] = useState("yearly");
  const [phone, setPhone] = useState(false);
  const [siteHost, setSiteHost] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [qr, setQr] = useState<{ outTradeNo: string; dataUrl: string } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 触屏设备扫不了自己屏幕上的码，付费改走「电脑下单 / 微信代开」两条出口
    setPhone(window.matchMedia("(hover: none)").matches);
    setSiteHost(window.location.host);
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: Me) => setMe(d))
      .catch(() => {});
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    timer.current = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [countdown]);

  const plan = me?.plans.find((p) => p.key === planKey) ?? null;

  async function sendCode() {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (r.status === 429) setErr(U.errTooFast);
      else if (!r.ok) setErr(U.errMail);
      else setCountdown(60);
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!r.ok) {
        setErr(r.status === 400 ? U.errCode : U.errGeneric);
      } else {
        const d = await fetch("/api/me").then((x) => x.json());
        setMe(d);
        window.dispatchEvent(new Event("vh-me-changed"));
        await startPay();
      }
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function startPay() {
    if (!plan) return;
    // 触屏设备上这张码没人能扫，所以不建订单，直接给替代出口
    if (phone) {
      setStep("guide");
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
      track("order_create", { plan: plan.key, amount: plan.money });
      setQr({ outTradeNo: d.outTradeNo, dataUrl: d.qr });
      setStep("qr");
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
        track("pay_success", { plan: plan?.key ?? "", amount: plan?.money ?? "" });
        const me2 = await fetch("/api/me").then((x) => x.json());
        setMe(me2);
        setQr(null);
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

  if (me?.user && me.pro && step !== "login") {
    return (
      <Shell locale={locale} onClose={onClose}>
        <div className="rd-pro-ok">
          <p>{U.proActive}</p>
          <p className="fineprint">
            {U.proUntil}{" "}
            {lifetimeShown(me.user.proUntil)
              ? U.proLifetime
              : me.user.proUntil?.slice(0, 10)}
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell locale={locale} onClose={onClose}>
      {step === "plans" && (
        <>
          <div className="mark">✦</div>
          <h3>{U.title}</h3>
          <p className="sub">{U.sub}</p>
          <div className="rd-plans">
            {(me?.plans ?? []).map((p) => {
              const f = FMT[p.key] ?? FMT.yearly;
              return (
                <div
                  key={p.key}
                  className={`rd-plan${planKey === p.key ? " is-active" : ""}`}
                  onClick={() => setPlanKey(p.key)}
                >
                  {p.listPrice && <span className="save">{U.limited}</span>}
                  <span className="rd-plan-label">{U[f.unit]}</span>
                  <b>¥{fmtMoney(p.money)}</b>
                  {p.listPrice && (
                    <span className="rd-plan-was">¥{fmtMoney(p.listPrice)}</span>
                  )}
                  <span className="rd-plan-unit">{U[f.label]}</span>
                </div>
              );
            })}
          </div>
          <ul>
            {U.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {err && <p className="rd-pro-err">{err}</p>}
          <button
            className="rd-btn rd-btn-block"
            disabled={busy || !me}
            onClick={() => {
              setErr("");
              if (me?.user) startPay();
              else setStep("login");
            }}
          >
            {U.cta}
          </button>
          <button className="rd-btn-ghost rd-btn-block" onClick={onClose}>
            {locale === "zh" ? "暂不订阅" : "Not now"}
          </button>
          <p className="fineprint rd-fine-links">
            {U.fineprint} ·{" "}
            <a href={`${base}/refunds`}>{U.linkRefunds}</a> ·{" "}
            <a href={`${base}/terms`}>{U.linkTerms}</a> ·{" "}
            <a href={`${base}/privacy`}>{U.linkPrivacy}</a>
          </p>
        </>
      )}

      {step === "login" && (
        <>
          <h3>{U.loginTitle}</h3>
          <p className="sub">{U.loginSub}</p>
          <input
            className="rd-field"
            type="email"
            placeholder={U.emailPh}
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="rd-code-row">
            <input
              className="rd-field"
              inputMode="numeric"
              maxLength={6}
              placeholder={U.codePh}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <button
              className="rd-btn-ghost"
              disabled={busy || countdown > 0 || !email}
              onClick={sendCode}
            >
              {countdown > 0
                ? `${countdown}s${U.resendIn}`
                : code
                  ? U.resend
                  : U.sendCode}
            </button>
          </div>
          {err && <p className="rd-pro-err">{err}</p>}
          <button
            className="rd-btn rd-btn-block"
            disabled={busy || code.length !== 6}
            onClick={verify}
          >
            {U.toPay}
          </button>
          <button className="rd-btn-ghost rd-btn-block" onClick={() => setStep("plans")}>
            {U.back}
          </button>
        </>
      )}

      {step === "qr" && qr && (
        <>
          <h3>{U.scan}</h3>
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

      {step === "guide" && (
        <>
          <h3>{U.guideTitle}</h3>
          {plan && (
            <p className="sub">
              {U.payAmount} <b className="rd-pay-amount">¥{fmtMoney(plan.money)}</b>
            </p>
          )}
          <p className="fineprint">{U.guideBody}</p>
          <div className="rd-guide">
            <div className="rd-guide-item">
              <h4>{U.guideWay1}</h4>
              <p>
                {U.guideWay1Body}
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
            <div className="rd-guide-item">
              <h4>{U.guideWay2}</h4>
              <p>{U.guideWay2Body}</p>
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
          <button className="rd-btn-ghost rd-btn-block" onClick={() => setStep("plans")}>
            {U.back}
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
  return (
    <div className="rd-overlay" onClick={onClose}>
      <div className="rd-pro" onClick={(e) => e.stopPropagation()}>
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
