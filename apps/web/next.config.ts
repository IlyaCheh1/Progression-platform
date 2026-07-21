import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.selstorage.ru", pathname: "/**" },
      { protocol: "https", hostname: "*.selcdn.ru", pathname: "/**" },
    ],
  },
};

export default nextConfig;
