"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProModal from "@/components/ProModal";
import { useFavoriteIndex } from "@/components/FavoritesView";
import { FREE_FAVORITE_LIMIT, useFavoriteSlugs, useMe } from "@/lib/favorites";
import { track } from "@/lib/track";

type Order = { plan: string; name: string; money: string; status: string; date: string };

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
  },
};

export default function AccountView({ locale }: { locale: "zh" | "en" }) {
  const U = UI[locale];
  const base = locale === "en" ? "/en" : "";
  const me = useMe();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showPro, setShowPro] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const slugs = useFavoriteSlugs();
  const [orders, setOrders] = useState<Order[]>([]);
  const taps = useRef({ n: 0, at: 0 });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const index = useFavoriteIndex(locale);

  // 隐藏入口：连点邮箱 5 次打开验证单。非白名单账号点了没有任何反应，不留线索
  function tapEmail() {
    const now = Date.now();
    taps.current =
      now - taps.current.at > 2000 ? { n: 1, at: now } : { n: taps.current.n + 1, at: now };
    if (taps.current.n < 5) return;
    taps.current = { n: 0, at: 0 };
    if (me?.payTest) setShowTest(true);
  }

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d: { orders: Order[] }) => setOrders(d.orders ?? []))
      .catch(() => {});
  }, [me?.user?.email]);

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
      else window.dispatchEvent(new Event("vh-me-changed"));
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setOrders([]);
    window.dispatchEvent(new Event("vh-me-changed"));
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
        <>
          <section className="acct-idbar">
            <div>
              <p className="acct-mail" onClick={tapEmail}>
                {me.user.email}
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
