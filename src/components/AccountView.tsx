"use client";

import { useEffect, useRef, useState } from "react";
import ProModal from "@/components/ProModal";
import { track } from "@/lib/track";

type Me = {
  user: { email: string; proUntil: string | null } | null;
  pro: boolean;
  payTest: { key: string } | null;
};

const UI = {
  zh: {
    title: "账号",
    loginTitle: "登录 BuildHub",
    loginSub: "验证码将发送至你的邮箱，仅用于登录",
    emailPh: "邮箱地址",
    sendCode: "获取验证码",
    resendIn: "后重发",
    resend: "重新获取",
    codePh: "6 位验证码",
    login: "登录",
    errGeneric: "出错了，请重试",
    errCode: "验证码错误或已过期",
    errMail: "邮件发送失败，请稍后重试",
    errTooFast: "发送太快，稍后再试",
    proOn: "PRO 会员",
    proUntil: "有效期至",
    proLifetime: "终身有效",
    proFree: "免费用户",
    goPro: "开通 PRO",
    renew: "续费",
    logout: "退出登录",
  },
  en: {
    title: "Account",
    loginTitle: "Sign in to BuildHub",
    loginSub: "A code will be emailed to you, used only for sign-in",
    emailPh: "Email address",
    sendCode: "Send code",
    resendIn: " to resend",
    resend: "Resend",
    codePh: "6-digit code",
    login: "Sign in",
    errGeneric: "Something went wrong, try again",
    errCode: "Wrong or expired code",
    errMail: "Failed to send email, try later",
    errTooFast: "Too fast, wait a minute",
    proOn: "PRO member",
    proUntil: "Valid until",
    proLifetime: "Lifetime",
    proFree: "Free plan",
    goPro: "Go PRO",
    renew: "Renew",
    logout: "Sign out",
  },
};

export default function AccountView({ locale }: { locale: "zh" | "en" }) {
  const U = UI[locale];
  const [me, setMe] = useState<Me | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showPro, setShowPro] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const taps = useRef({ n: 0, at: 0 });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 隐藏入口：连点邮箱 5 次打开验证单。非白名单账号点了没有任何反应，不留线索
  function tapEmail() {
    const now = Date.now();
    taps.current =
      now - taps.current.at > 2000 ? { n: 1, at: now } : { n: taps.current.n + 1, at: now };
    if (taps.current.n < 5) return;
    taps.current = { n: 0, at: 0 };
    if (me?.payTest) setShowTest(true);
  }

  function load() {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: Me) => setMe(d))
      .catch(() => {});
  }
  useEffect(load, []);

  useEffect(() => {
    if (countdown <= 0) return;
    timer.current = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [countdown]);

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

  async function login() {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!r.ok) setErr(r.status === 400 ? U.errCode : U.errGeneric);
      else {
        load();
        window.dispatchEvent(new Event("vh-me-changed"));
      }
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setMe({ user: null, pro: false, payTest: null });
    window.dispatchEvent(new Event("vh-me-changed"));
  }

  const proUntilText =
    me?.user?.proUntil && me.user.proUntil.slice(0, 4) >= "2050"
      ? U.proLifetime
      : me?.user?.proUntil?.slice(0, 10);

  return (
    <main className="rd-account">
      <h1>{U.title}</h1>
      {me === null ? null : !me.user ? (
        <section className="rd-card">
          <h2>{U.loginTitle}</h2>
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
            onClick={login}
          >
            {U.login}
          </button>
        </section>
      ) : (
        <section className="rd-card">
          <p className="rd-acct-email" onClick={tapEmail}>{me.user.email}</p>
          <p className={`rd-acct-plan${me.pro ? " is-pro" : ""}`}>
            {me.pro ? `✦ ${U.proOn}` : U.proFree}
            {me.pro && proUntilText && (
              <span>
                {" "}
                · {U.proUntil} {proUntilText}
              </span>
            )}
          </p>
          <div className="rd-acct-actions">
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
            <button className="rd-btn-ghost" onClick={logout}>
              {U.logout}
            </button>
          </div>
        </section>
      )}
      {showPro && <ProModal locale={locale} onClose={() => setShowPro(false)} />}
      {showTest && (
        <ProModal locale={locale} entry="test" onClose={() => setShowTest(false)} />
      )}
    </main>
  );
}
