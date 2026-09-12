import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Baked in at build time (each platform builds its own artifact from
    // source, so this correctly reflects Vercel vs. Netlify/local for that
    // specific deploy). Tells upload-client.ts whether to upload files
    // directly to Vercel Blob from the browser (see /api/blob/upload-token)
    // instead of routing them through our own server, which Vercel caps at
    // 4.5MB per request — well under what video uploads need.
    NEXT_PUBLIC_DIRECT_UPLOAD: process.env.VERCEL ? "1" : "",
  },
};

export default nextConfig;
