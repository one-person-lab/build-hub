import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  async redirects() {
    return [
      { source: "/assets", destination: "/topics/assets", permanent: true },
      { source: "/en/assets", destination: "/en/topics/assets", permanent: true },
    ];
  },
};

export default nextConfig;
