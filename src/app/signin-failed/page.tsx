import type { Metadata } from "next";
import { safeNext } from "@/lib/wxlogin";

export const metadata: Metadata = {
  title: "登录未完成 · BuildHub",
  robots: { index: false, follow: false },
};

const UI = {
  zh: {
    github: {
      title: "GitHub 登录没走完",
      sub: "可能是点了取消，也可能授权过期。再试一次，或改用邮箱。",
      retry: "再用 GitHub 登录",
      retryHref: (next: string) =>
        `/api/auth/github/start?next=${encodeURIComponent(next)}`,
    },
    wechat: {
      title: "微信登录没走完",
      sub: "可能是点了取消，也可能是二维码过期。再试一次：电脑版微信已登录时可以直接确认。",
      retry: "再用微信登录",
      retryHref: (next: string) =>
        `/api/auth/wx/start?next=${encodeURIComponent(next)}${
          next.startsWith("/en") ? "&lang=en" : ""
        }`,
    },
    mail: "用邮箱登录",
    account: "/account",
  },
  en: {
    github: {
      title: "GitHub sign-in didn't finish",
      sub: "You may have cancelled, or the session expired. Try again, or use email.",
      retry: "Try GitHub again",
      retryHref: (next: string) =>
        `/api/auth/github/start?next=${encodeURIComponent(next)}`,
    },
    wechat: {
      title: "WeChat sign-in didn't finish",
      sub: "You may have cancelled, or the code expired. Try again — if WeChat is open on this computer, you can confirm directly.",
      retry: "Try WeChat again",
      retryHref: (next: string) =>
        `/api/auth/wx/start?next=${encodeURIComponent(next)}${
          next.startsWith("/en") ? "&lang=en" : ""
        }`,
    },
    mail: "Sign in with email",
    account: "/en/account",
  },
};

/** OAuth 回跳失败落点：不弹窗，直接给出下一步 */
export default async function SignInFailedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const origin = process.env.APP_URL || "http://localhost:3000";
  const next = safeNext(
    typeof params.next === "string" ? params.next : null,
    origin
  );
  const via = typeof params.via === "string" ? params.via : "wechat";
  const pack = next.startsWith("/en") ? UI.en : UI.zh;
  const U = via === "github" ? pack.github : pack.wechat;

  return (
    <main className="rd-account">
      <h1>{U.title}</h1>
      <section className="rd-card acct-login acct-failed">
        <p className="sub">{U.sub}</p>
        <div className="rd-ctas">
          <a className="rd-btn" href={U.retryHref(next)}>
            {U.retry}
          </a>
          <a className="rd-btn-ghost" href={pack.account}>
            {pack.mail}
          </a>
        </div>
      </section>
    </main>
  );
}
