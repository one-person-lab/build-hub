"use client";

import { useState } from "react";

const UI = {
  zh: {
    sub: "为认真做产品的人",
    monthly: "月付",
    yearly: "年付",
    save: "省 31%",
    benefits: ["无限收藏与跨设备同步", "图鉴视图与 Markdown 导出", "新风格词条抢先看"],
    trial: "开始 7 天免费试用",
    later: "暂不订阅",
    fineprint: "付费功能即将上线，基础浏览永远免费",
  },
  en: {
    sub: "For people who ship seriously",
    monthly: "Monthly",
    yearly: "Yearly",
    save: "Save 31%",
    benefits: [
      "Unlimited favorites & cross-device sync",
      "Index view & Markdown export",
      "Early access to new style entries",
    ],
    trial: "Start 7-day free trial",
    later: "Not now",
    fineprint: "Paid plan coming soon · browsing stays free forever",
  },
};

export default function ProModal({
  locale,
  onClose,
}: {
  locale: "zh" | "en";
  onClose: () => void;
}) {
  const [yearly, setYearly] = useState(true);
  const U = UI[locale];
  return (
    <div className="rd-overlay" onClick={onClose}>
      <div className="rd-pro" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label={U.later}>
          ×
        </button>
        <div className="mark">✦</div>
        <h3>BuildHub PRO</h3>
        <p className="sub">{U.sub}</p>
        <div className="rd-prices">
          <div className={`rd-price${!yearly ? " is-active" : ""}`} onClick={() => setYearly(false)}>
            {U.monthly}
            <b>¥18</b>
          </div>
          <div className={`rd-price${yearly ? " is-active" : ""}`} onClick={() => setYearly(true)}>
            <span className="save">{U.save}</span>
            {U.yearly}
            <b>¥148</b>
          </div>
        </div>
        <ul>
          {U.benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <span className="rd-pro-soon">{U.trial}</span>
        <button className="rd-btn rd-btn-block" onClick={onClose}>
          {U.later}
        </button>
        <p className="fineprint">{U.fineprint}</p>
      </div>
    </div>
  );
}
