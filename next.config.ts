import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
