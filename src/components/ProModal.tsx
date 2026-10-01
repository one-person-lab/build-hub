"use client";

import { useEffect, useRef, useState } from "react";

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
    payTitle: "选择支付方式",
    alipay: "支付宝",
    wxpay: "微信支付",
    payAmount: "支付金额",
    payNow: "立即支付",
    jumpHint: "即将跳转收银台…",
    scan: "微信扫码支付",
    scanHint: "支付成功后自动开通，无需刷新",
    errWxOff: "微信支付暂未开放，请先用支付宝",
    errGeneric: "出错了，请重试",
    errCode: "验证码错误或已过期",
    errMail: "邮件发送失败，请稍后重试",
    errTooFast: "发送太快，稍后再试",
    proActive: "你已是 PRO 会员",
    proUntil: "有效期至",
    proLifetime: "终身有效",
    fineprint: "基础浏览永远免费 · 支付宝 / 微信安全支付",
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
    payTitle: "Choose payment method",
    alipay: "Alipay",
    wxpay: "WeChat Pay",
    payAmount: "Amount",
    payNow: "Pay now",
    jumpHint: "Redirecting to checkout…",
    scan: "Scan with WeChat",
    scanHint: "Activates automatically once paid",
    errWxOff: "WeChat Pay isn't available yet, try Alipay",
    errGeneric: "Something went wrong, try again",
    errCode: "Wrong or expired code",
    errMail: "Failed to send email, try later",
    errTooFast: "Too fast, wait a minute",
    proActive: "You're already a PRO member",
    proUntil: "Valid until",
    proLifetime: "Lifetime",
    fineprint: "browsing stays free forever",
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
  const [me, setMe] = useState<Me | null>(null);
  const [step, setStep] = useState<"plans" | "login" | "pay" | "qr">("plans");
  const [planKey, setPlanKey] = useState("yearly");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [payType, setPayType] = useState<"alipay" | "wxpay">("alipay");
  const [qr, setQr] = useState<{ outTradeNo: string; dataUrl: string } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
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
        setStep("pay");
      }
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!plan) return;
    setErr("");
    setBusy(true);
    try {
      if (payType === "wxpay") {
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
        setQr({ outTradeNo: d.outTradeNo, dataUrl: d.qr });
        setStep("qr");
        return;
      }
      const r = await fetch("/api/pay/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: plan.key, type: payType }),
      });
      if (!r.ok) {
        setErr(U.errGeneric);
        return;
      }
      const { gateway, params } = await r.json();
      const form = document.createElement("form");
      form.method = "POST";
      form.action = gateway;
      for (const [k, v] of Object.entries(params as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
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
        const me2 = await fetch("/api/me").then((x) => x.json());
        setMe(me2);
        setQr(null);
        setStep("pay");
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

  if (me?.user && (step === "plans" || step === "pay") && me.pro) {
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
              setStep(me?.user ? "pay" : "login");
            }}
          >
            {U.cta}
          </button>
          <button className="rd-btn-ghost rd-btn-block" onClick={onClose}>
            {locale === "zh" ? "暂不订阅" : "Not now"}
          </button>
          <p className="fineprint">{U.fineprint}</p>
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

      {step === "pay" && (
        <>
          <h3>{U.payTitle}</h3>
          {plan && (
            <p className="sub">
              {U.payAmount}{" "}
              <b className="rd-pay-amount">¥{fmtMoney(plan.money)}</b>{" "}
              · {U[FMT[plan.key]?.unit ?? "yearly"]}
            </p>
          )}
          <div className="rd-pay-types">
            <button
              className={`rd-pay-type${payType === "alipay" ? " is-active" : ""}`}
              onClick={() => setPayType("alipay")}
            >
              {U.alipay}
            </button>
            <button
              className={`rd-pay-type${payType === "wxpay" ? " is-active" : ""}`}
              onClick={() => setPayType("wxpay")}
            >
              {U.wxpay}
            </button>
          </div>
          {err && <p className="rd-pro-err">{err}</p>}
          <button className="rd-btn rd-btn-block" disabled={busy} onClick={pay}>
            {busy ? U.jumpHint : U.payNow}
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
              setStep("pay");
            }}
          >
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
