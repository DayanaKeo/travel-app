const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dp4yhyuyj/image/upload/**",
      },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  experimental: { optimizePackageImports: ["lucide-react"] },
};

module.exports = withPWA(nextConfig);
