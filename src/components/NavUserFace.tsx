"use client";

import BrandMark from "./BrandMark";

/** 未登录：人像图标；已登录：用户头像，没有就用站点 Logo */
export default function NavUserFace({
  signedIn,
  avatarUrl,
  className,
}: {
  signedIn: boolean;
  avatarUrl?: string | null;
  className?: string;
}) {
  if (signedIn && avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={className} src={avatarUrl} alt="" width={30} height={30} referrerPolicy="no-referrer" />
    );
  }
  if (signedIn) {
    return (
      <span className={className} aria-hidden>
        <BrandMark />
      </span>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5 19.2c1.6-3.1 4-4.7 7-4.7s5.4 1.6 7 4.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
