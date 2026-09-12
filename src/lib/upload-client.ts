"use client";

import { upload } from "@vercel/blob/client";
import { extensionForMime } from "@/lib/mime";

// True only in a build produced for Vercel (see next.config.ts) — on
// Netlify or local dev, uploads keep going through our own server as
// multipart/form-data (see /api/media, /api/profile/photo), unaffected.
export const DIRECT_UPLOAD = process.env.NEXT_PUBLIC_DIRECT_UPLOAD === "1";

export interface DirectUploadResult {
  key: string;
  sizeBytes: number;
  mimeType: string;
}

/** Uploads a file straight from the browser to Vercel Blob, bypassing our
 * server entirely (which caps request bodies at 4.5MB) — authorized by a
 * short-lived token minted by /api/blob/upload-token. */
export async function uploadFileDirect(file: File, subdir: string): Promise<DirectUploadResult> {
  const pathname = `${subdir}/${crypto.randomUUID()}.${extensionForMime(file.type)}`;
  const blob = await upload(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/blob/upload-token",
  });
  return { key: blob.pathname, sizeBytes: file.size, mimeType: file.type };
}
