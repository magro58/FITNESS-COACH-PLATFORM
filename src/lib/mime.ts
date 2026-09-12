// Pure, environment-agnostic constants shared by the server-side storage
// module (src/lib/storage.ts) and the client-side direct-upload helper
// (src/lib/upload-client.ts). Kept separate from storage.ts because that
// file imports Node-only packages (fs, @netlify/blobs, @vercel/blob) that
// must never end up in a browser bundle.

export const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export function extensionForMime(mimeType: string): string {
  return EXT_BY_MIME[mimeType] ?? "bin";
}

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB

export const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/quicktime", "video/webm"]);
