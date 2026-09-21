"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import chromeData from "@/data/chrome.json";
import enChromeData from "@/data/en-chrome.json";

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

export default function SiteFooter() {
  const pathname = usePathname();
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const chrome = (isEn ? enChromeData : chromeData) as { footerHtml: string };
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

  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: chrome.footerHtml }}
        onClick={(e) => {
          const trigger = (e.target as HTMLElement).closest<HTMLElement>("[data-open-qr]");
          if (trigger) setQrKey(trigger.dataset.openQr ?? null);
        }}
      />
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
