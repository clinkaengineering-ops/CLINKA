// next.config.ts
import type { NextConfig } from "next";

const backendOrigin = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://127.0.0.1:5000"
).replace(/\/$/, "");

function backendHostname(): string | undefined {
  try {
    return new URL(backendOrigin).hostname;
  } catch {
    return undefined;
  }
}

const uploadHost = backendHostname();

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      ...(uploadHost
        ? [
            {
              protocol: backendOrigin.startsWith("https") ? "https" : "http",
              hostname: uploadHost,
            } as const,
          ]
        : []),
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
