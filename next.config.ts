import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy: only load things from this site, and nothing may frame it.
// 'unsafe-inline' is needed because Next.js puts small inline scripts and styles in each page;
// a stricter nonce-based policy would force every page to render on every request.
// Dev mode also needs 'unsafe-eval' (React's debugging tools) and must not upgrade http to https.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// Strict-Transport-Security is already sent by Vercel, so it is not repeated here.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false, // do not advertise the framework
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // the auditor used to live on its own page; keep old links working
  async redirects() {
    return [{ source: "/audit", destination: "/#auditor", permanent: false }];
  },
  devIndicators: false, // hides the dev-only "N" badge
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
