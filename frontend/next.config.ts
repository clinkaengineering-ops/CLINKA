// next.config.ts
import type { NextConfig } from "next";
import { collectUploadImagePatterns } from "./lib/imageRemotePatterns";

const backendOrigin = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://127.0.0.1:5000"
).replace(/\/$/, "");

const uploadPatterns = collectUploadImagePatterns({
  backendOrigin,
  nextPublicBackendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL,
  nextPublicUploadBaseUrl: process.env.NEXT_PUBLIC_UPLOAD_BASE_URL,
});

const nextConfig: NextConfig = {
  output: "standalone",
  // Dev/proxy buffers the request body (default 10MB). Engineer register can be
  // 1 document + 10 portfolio images; deliverables allow 10 × 25MB.
  experimental: {
    proxyClientMaxBodySize: "256mb",
  },
  images: {
    remotePatterns: [
      ...uploadPatterns,
      // Legacy avatars/covers still stored as Cloudinary URLs in the database
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];

    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
