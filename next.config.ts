import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      // Open-source animated exercise demos
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
  },
  experimental: {
    // Server Actions are enabled by default in Next 15; keep the limit generous
    // for progress-photo uploads encoded as form data.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
