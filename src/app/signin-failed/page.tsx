import type { Metadata } from "next";
import { safeNext } from "@/lib/wxlogin";

export const metadata: Metadata = {
  title: "微信登录没走完 · BuildHub",
  robots: { index: false, follow: false },
};

const UI = {
  zh: {
    title: "微信登录没走完",
    sub: "二维码可能过期了，也可能是你在微信里点了取消。重新扫一次就行。",
    retry: "重新扫码",
    mail: "用邮箱登录",
    account: "/account",
  },
  en: {
    title: "WeChat sign-in didn't finish",
    sub: "The code may have expired, or you tapped Cancel in WeChat. Scan it once more.",
    retry: "Scan again",
    mail: "Sign in with email",
    account: "/en/account",
  },
};

/** 微信扫码回来的落点：不弹任何东西，直接把「没成」和下一步摆在这一页 */
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
  const U = next.startsWith("/en") ? UI.en : UI.zh;

  return (
    <main className="rd-account">
      <h1>{U.title}</h1>
      <section className="rd-card acct-login acct-failed">
        <p className="sub">{U.sub}</p>
        <div className="rd-ctas">
          <a
            className="rd-btn"
            href={`/api/auth/wx/start?next=${encodeURIComponent(next)}`}
          >
            {U.retry}
          </a>
          <a className="rd-btn-ghost" href={U.account}>
            {U.mail}
          </a>
        </div>
      </section>
    </main>
  );
}
