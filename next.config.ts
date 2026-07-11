import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Studio folded into the Evolution cockpit.
    return [{ source: "/studio", destination: "/evolution", permanent: true }];
  },
  // resvg is a native binding used only by the offline engine, never bundled
  // into the app. Keep it external so `next build` never tries to trace it.
  serverExternalPackages: ["@resvg/resvg-js", "jsdom", "dompurify"],
};

export default nextConfig;
