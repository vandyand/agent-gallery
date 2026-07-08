import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // resvg is a native binding used only by the offline engine, never bundled
  // into the app. Keep it external so `next build` never tries to trace it.
  serverExternalPackages: ["@resvg/resvg-js", "jsdom", "dompurify"],
};

export default nextConfig;
