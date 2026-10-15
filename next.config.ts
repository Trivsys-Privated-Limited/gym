import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All imagery is bundled locally in /public; skip the server-side optimizer (sharp).
  images: { unoptimized: true },
};

export default nextConfig;
