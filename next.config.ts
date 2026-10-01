import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  async headers() {
    return [
      {
        // public/assets 下都是手工维护的静态图。默认 max-age=0 会让每次跳转
        // 对每张图发一轮条件请求（304 回源），线上 RTT 直接变成图片空窗。
        // 换图时改文件名，否则访问者最长 7 天才看到新图。
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/assets", destination: "/design", permanent: true },
      { source: "/en/assets", destination: "/en/design", permanent: true },
      { source: "/topics/design", destination: "/design", permanent: true },
      { source: "/topics/assets", destination: "/design", permanent: true },
      { source: "/en/topics/design", destination: "/en/design", permanent: true },
      { source: "/en/topics/assets", destination: "/en/design", permanent: true },
    ];
  },
};

export default nextConfig;
