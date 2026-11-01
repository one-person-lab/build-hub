"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BrandMark from "./BrandMark";
import { requireLogin } from "@/lib/auth-modal";
import { FOOTER_SOCIAL_ICONS } from "@/data/footer-icons";

type Locale = "zh" | "en";

const SOCIALS = [
  { key: "github", href: "https://github.com/one-person-lab", label: "GitHub" },
  {
    key: "xiaohongshu",
    href: "https://www.xiaohongshu.com/user/profile/5cc32828000000001203745e",
    label: "小红书",
  },
  { key: "douyin", qr: "douyin", label: "抖音" },
  { key: "website", href: "https://lab.smzsapp.com/", label: "个人网站" },
  { key: "wechat", qr: "wechat", label: "微信联系" },
];

const QR_IMAGES: Record<string, { src: string; altZh: string; altEn: string }> = {
  wechat: {
    src: "/assets/wechat-qr.png",
    altZh: "扫描二维码，添加我为朋友",
    altEn: "Scan to add me on WeChat",
  },
  douyin: {
    src: "/assets/douyin-qr.jpg",
    altZh: "打开抖音搜索页扫一扫，关注我的抖音",
    altEn: "Scan in the Douyin app to follow me",
  },
};

const COPY = {
  zh: {
    aria: "联系方式",
    blurb: "给非工程师的 AI 编程入门站。用大白话讲概念，用示例帮你动手，把会的东西变成可用的资产。",
    columns: [
      {
        title: "站点",
        links: [
          { label: "首页", href: "/" },
          { label: "概念", href: "/topics/frontend" },
          { label: "设计风格", href: "/design" },
          { label: "技术栈", href: "/stack" },
          { label: "产品", href: "/products" },
        ],
      },
      {
        title: "学习",
        links: [
          { label: "路径", href: "/paths" },
          { label: "提示词", href: "/prompts" },
          { label: "技能", href: "/skills" },
          { label: "手册", href: "/playbooks" },
          { label: "练习", href: "/practice" },
        ],
      },
      {
        title: "资源",
        links: [
          { label: "动效", href: "/distill" },
          { label: "专题", href: "/explains" },
          { label: "更新日志", href: "/changelog" },
          { label: "BuildHub Skill", href: "/buildhub-skill" },
          { label: "反 AI 味", href: "/anti-ai-flavor" },
        ],
      },
      {
        title: "账号与法律",
        links: [
          { label: "登录", href: "/account" },
          { label: "收藏", href: "/favorites" },
          { label: "隐私", href: "/privacy" },
          { label: "条款", href: "/terms" },
          { label: "退款", href: "/refunds" },
        ],
      },
    ],
    socialCopy: {
      github: "@one-person-lab",
      xiaohongshu: "我的小红书主页",
      douyin: "扫码关注 · @醒醒老己",
      website: "lab.smzsapp.com",
      wechat: "扫码添加 · 投稿建议",
    } as Record<string, string>,
    legal: { beian: "闽ICP备2023002772号-7", refunds: "退款与售后", terms: "用户协议", privacy: "隐私政策" },
    rights: "© 2026 BuildHub. 保留所有权利。",
  },
  en: {
    aria: "Links and contact",
    blurb: "AI coding for non-engineers. Plain-word concepts, playable examples, and the assets to turn what you know into something you can use.",
    columns: [
      {
        title: "Site",
        links: [
          { label: "Home", href: "/en" },
          { label: "Concepts", href: "/en/topics/frontend" },
          { label: "Design", href: "/en/design" },
          { label: "Products", href: "/en/products" },
          { label: "Skills", href: "/en/skills" },
        ],
      },
      {
        title: "Learn",
        links: [
          { label: "Prompts", href: "/en/prompts" },
          { label: "Motion", href: "/en/distill" },
          { label: "Practice", href: "/en/practice" },
          { label: "BuildHub Skill", href: "/en/buildhub-skill" },
          { label: "Anti AI-flavor", href: "/en/anti-ai-flavor" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Changelog", href: "/en/changelog" },
          { label: "Favorites", href: "/en/favorites" },
          { label: "Account", href: "/en/account" },
          { label: "中文", href: "/" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/en/privacy" },
          { label: "Terms", href: "/en/terms" },
          { label: "Refunds", href: "/en/refunds" },
        ],
      },
    ],
    socialCopy: {
      github: "@one-person-lab",
      xiaohongshu: "My Xiaohongshu profile",
      douyin: "Scan to follow",
      website: "lab.smzsapp.com",
      wechat: "Scan to add · suggestions",
    } as Record<string, string>,
    legal: { beian: "闽ICP备2023002772号-7", refunds: "Refunds", terms: "Terms", privacy: "Privacy" },
    rights: "© 2026 BuildHub. All rights reserved.",
  },
};

export default function SiteFooter() {
  const pathname = usePathname();
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const locale: Locale = isEn ? "en" : "zh";
  const C = COPY[locale];
  const base = isEn ? "/en" : "";
  const router = useRouter();
  const [qrKey, setQrKey] = useState<string | null>(null);
  const qr = qrKey ? QR_IMAGES[qrKey] : null;

  useEffect(() => {
    if (!qr) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQrKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qr]);

  if (pathname.startsWith("/proto")) return null;

  function signIn() {
    requireLogin({ onDone: () => router.push(`${base}/account`) });
  }

  return (
    <>
      <footer className="site-footer" id="contact">
        <div className="site-footer-shell">
          <div className="footer-top">
            <div className="footer-brand">
              <Link href={base || "/"} className="footer-brand-logo">
                <span className="footer-brand-mark" aria-hidden>
                  <BrandMark />
                </span>
                BuildHub
              </Link>
              <p>{C.blurb}</p>
            </div>
            <div className="footer-cols">
              {C.columns.map((col) => (
                <nav key={col.title} aria-label={col.title}>
                  <p>{col.title}</p>
                  {col.links.map((l) =>
                    l.href === `${base}/account` ? (
                      <button type="button" key={l.label} onClick={signIn}>
                        {l.label}
                      </button>
                    ) : (
                      <Link key={l.label} href={l.href}>
                        {l.label}
                      </Link>
                    ),
                  )}
                </nav>
              ))}
            </div>
          </div>

          <nav className="footer-socials" aria-label={C.aria}>
            {SOCIALS.map((s) => {
              const card = (
                <>
                  <span
                    className="footer-social-icon"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: FOOTER_SOCIAL_ICONS[s.key] }}
                  />
                  <span className="footer-social-copy">
                    <strong>{s.label}</strong>
                    <small>{C.socialCopy[s.key]}</small>
                  </span>
                  <i
                    className={`ti ${s.qr ? "ti-plus" : "ti-arrow-up-right"} footer-social-arrow`}
                    aria-hidden="true"
                  />
                </>
              );
              return s.qr ? (
                <button
                  key={s.key}
                  className={`footer-social-link${s.key === "wechat" ? " footer-contribute-card" : ""}`}
                  type="button"
                  onClick={() => setQrKey(s.qr!)}
                >
                  {card}
                </button>
              ) : (
                <a
                  key={s.key}
                  className="footer-social-link"
                  data-social={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {card}
                </a>
              );
            })}
          </nav>

          <div className="footer-bottom">
            <p className="footer-legal">
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
                {C.legal.beian}
              </a>{" "}
              ·{" "}
              <Link href={`${base}/refunds`}>{C.legal.refunds}</Link> ·{" "}
              <Link href={`${base}/terms`}>{C.legal.terms}</Link> ·{" "}
              <Link href={`${base}/privacy`}>{C.legal.privacy}</Link>
            </p>
            <span className="footer-rights">{C.rights}</span>
          </div>
        </div>
      </footer>
      {qr && (
        <div
          className="footer-qr-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={isEn ? "QR code" : "二维码"}
          onClick={() => setQrKey(null)}
        >
          <img
            className="footer-qr-image"
            src={qr.src}
            alt={isEn ? qr.altEn : qr.altZh}
            draggable={false}
          />
        </div>
      )}
    </>
  );
}
