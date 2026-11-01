"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import zhCatalogs from "@/data/catalogs.json";
import enCatalogs from "@/data/en-catalogs.json";
import CardDemoThumb from "./CardDemoThumb";
import { useMe } from "@/lib/favorites";
import { registerAuthModal, setSignedIn } from "@/lib/auth-modal";
import "./AuthModal.css";

type Locale = "zh" | "en";
type RawCard = { slug: string; name: string; en?: string; demoHtml?: string; demoClass?: string };
type RawCatalog = { key: string; groups?: { terms?: RawCard[] }[] };

// 右侧样张河：站内真实的界面样张与动效卡，取 catalogs.json 里带预览的条目
const RIVER_SLUGS = [
  "style-glass",
  "style-bento",
  "motion-bounce-cards",
  "style-apple",
  "style-journal-cards",
  "motion-card-carousel",
  "style-brutalism",
  "style-notion",
  "style-editorial",
  "style-terminal",
  "style-duolingo",
];

const UI = {
  zh: {
    title: "登录",
    sub: "邮箱收 6 位验证码，不用设密码。",
    subPro: "开通 PRO 需先登录。验证码发到你邮箱，不用设密码。",
    subCopy: "复制提示词需先登录。验证码发到你邮箱，不用设密码。",
    emailPh: "邮箱地址",
    codePh: "6 位验证码",
    send: "获取验证码",
    verify: "登录",
    sentTo: "已发送至",
    resendIn: "后重新获取",
    resend: "重新获取",
    changeEmail: "换个邮箱",
    errGeneric: "出错了，请重试",
    errCode: "验证码错误或已过期",
    errMail: "邮件发送失败，请稍后重试",
    errTooFast: "发送太快，稍后再试",
    legal: "继续即表示你同意我们的",
    terms: "服务条款",
    privacy: "隐私政策",
    close: "关闭",
    trust: "已收录的产品拆解",
  },
  en: {
    title: "Log in",
    sub: "A 6-digit code lands in your inbox. No password.",
    subPro: "Sign in to continue to checkout. We email you a 6-digit code.",
    subCopy: "Sign in to copy prompts. We email you a 6-digit code.",
    emailPh: "Email address",
    codePh: "6-digit code",
    send: "Send code",
    verify: "Log in",
    sentTo: "Sent to",
    resendIn: " to resend",
    resend: "Resend",
    changeEmail: "Change email",
    errGeneric: "Something went wrong, try again",
    errCode: "Wrong or expired code",
    errMail: "Failed to send the email, try later",
    errTooFast: "Too fast, wait a minute",
    legal: "By continuing you agree to our",
    terms: "Terms",
    privacy: "Privacy Policy",
    close: "Close",
    trust: "Products dissected inside",
  },
};

const TRUST = [
  { name: "Figma", logo: "/assets/logos/figma.png" },
  { name: "Linear", logo: "/assets/logos/linear.png" },
  { name: "Cursor", logo: "/assets/logos/cursor.png" },
  { name: "Raycast", logo: "/assets/logos/raycast.png" },
];

function indexTerms(catalogs: RawCatalog[]) {
  const map = new Map<string, RawCard>();
  catalogs.forEach((c) =>
    (c.groups ?? []).forEach((g) =>
      (g.terms ?? []).forEach((t) => {
        if (t.demoHtml && !map.has(t.slug)) map.set(t.slug, t);
      }),
    ),
  );
  return map;
}

function TrustLogo({ name, logo }: { name: string; logo: string }) {
  return (
    <span className="bam-trust-item">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt="" width={20} height={20} />
      <span>{name}</span>
    </span>
  );
}

function Showcase({ locale }: { locale: Locale }) {
  const columns = useMemo(() => {
    const idx = indexTerms((locale === "en" ? enCatalogs : zhCatalogs) as RawCatalog[]);
    const half = Math.ceil(RIVER_SLUGS.length / 2);
    const pick = (slugs: string[]) =>
      slugs.map((s) => idx.get(s)).filter((t): t is RawCard => Boolean(t));
    return [pick(RIVER_SLUGS.slice(0, half)), pick(RIVER_SLUGS.slice(half)).reverse()];
  }, [locale]);

  return (
    <aside className="bam-show" aria-hidden="true">
      <div className="bam-stage">
        <div className="bam-river-wrap">
          <div className="bam-cols">
            {columns.map((col, ci) => (
              <div className="bam-col" key={ci}>
                <div className={ci === 1 ? "bam-river is-slow" : "bam-river"}>
                  {[...col, ...col].map((card, i) => (
                    <figure className="bam-card" key={`${card.slug}-${i}`}>
                      <div className="bam-frame">
                        <CardDemoThumb demoHtml={card.demoHtml} demoClass={card.demoClass} />
                      </div>
                      <figcaption className="bam-cap">{card.name}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bam-trust">
          <p className="bam-trust-label">{UI[locale].trust}</p>
          <div className="bam-trust-row">
            {TRUST.map((t) => (
              <TrustLogo key={t.name} {...t} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function AuthModal({
  locale,
  reason,
  onClose,
  onDone,
}: {
  locale: Locale;
  reason?: "pro" | "favorite" | "playbook" | "copy";
  onClose: () => void;
  onDone: () => void;
}) {
  const U = UI[locale];
  const base = locale === "en" ? "/en" : "";
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(t);
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
      else {
        setCountdown(60);
        setStep("code");
      }
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
        return;
      }
      window.dispatchEvent(new Event("vh-me-changed"));
      onDone();
    } catch {
      setErr(U.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return createPortal(
    <>
      <div className="bam-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()} />
      <div className="bam-panel" role="dialog" aria-modal="true" aria-label={U.title}>
        <button className="bam-close" type="button" onClick={onClose} aria-label={U.close} title={U.close}>
          <X size={14} strokeWidth={2} aria-hidden />
        </button>

        <div className="bam-form">
          <div className="bam-head bam-rise">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="bam-mark" src="/icon.svg" alt="" width={28} height={28} />
            <h2 className="bam-title">{U.title}</h2>
            <p className="bam-sub">
              {reason === "pro" ? U.subPro : reason === "copy" ? U.subCopy : U.sub}
            </p>
          </div>

          <div className="bam-body bam-rise d1">
            {step === "email" ? (
              <form
                className="bam-fields"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!busy && emailOk) sendCode();
                }}
              >
                <div className="bam-row">
                  <input
                    ref={emailRef}
                    className="bam-input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    aria-label={U.emailPh}
                    placeholder={U.emailPh}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button className="bam-go" type="submit" disabled={busy || !emailOk}>
                    {U.send}
                    <ArrowRight size={14} strokeWidth={2} aria-hidden />
                  </button>
                </div>
                {err && <p className="bam-err">{err}</p>}
              </form>
            ) : (
              <form
                className="bam-fields"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!busy && code.length === 6) verify();
                }}
              >
                <div className="bam-row">
                  <input
                    ref={codeRef}
                    className="bam-input is-code"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    aria-label={U.codePh}
                    placeholder={U.codePh}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                  <button className="bam-go" type="submit" disabled={busy || code.length !== 6}>
                    {U.verify}
                  </button>
                </div>
                <p className="bam-hint">
                  {U.sentTo} <b>{email}</b>
                  {countdown > 0 ? (
                    <>
                      {" · "}
                      <b>{countdown}s</b>
                      {U.resendIn}
                    </>
                  ) : (
                    <>
                      {" · "}
                      <button type="button" onClick={sendCode} disabled={busy || !emailOk}>
                        {U.resend}
                      </button>
                    </>
                  )}
                  {" · "}
                  <button
                    type="button"
                    onClick={() => {
                      setCode("");
                      setErr("");
                      setStep("email");
                    }}
                  >
                    {U.changeEmail}
                  </button>
                </p>
                {err && <p className="bam-err">{err}</p>}
              </form>
            )}

            <p className="bam-legal">
              {U.legal}{" "}
              <a href={`${base}/terms`}>{U.terms}</a> · <a href={`${base}/privacy`}>{U.privacy}</a>
            </p>
          </div>
        </div>

        <Showcase locale={locale} />
      </div>
    </>,
    document.body,
  );
}

/** 挂在根布局里：全站 requireLogin() 都由这唯一的实例接住 */
export function AuthModalHost() {
  const me = useMe();
  const pathname = usePathname();
  const locale: Locale = pathname?.startsWith("/en") ? "en" : "zh";
  const [pending, setPending] = useState<{ reason?: "pro" | "favorite" | "playbook" | "copy" } | null>(null);
  const doneRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setSignedIn(!!me?.user);
  }, [me]);

  useEffect(() => {
    registerAuthModal((opts) => {
      doneRef.current = opts.onDone ?? null;
      setPending({ reason: opts.reason });
    });
    return () => registerAuthModal(null);
  }, []);

  if (!pending) return null;

  return (
    <AuthModal
      locale={locale}
      reason={pending.reason}
      onClose={() => {
        doneRef.current = null;
        setPending(null);
      }}
      onDone={() => {
        setPending(null);
        const fn = doneRef.current;
        doneRef.current = null;
        fn?.();
      }}
    />
  );
}

export default AuthModal;
