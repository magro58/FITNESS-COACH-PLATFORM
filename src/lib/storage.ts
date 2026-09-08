import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Local-filesystem object storage. Files live outside `public/` so nothing is
// served without an authorization check (see /api/media, /api/profile-photo).
// The interface (save/read/delete by key) is intentionally storage-agnostic so
// swapping this module for Supabase Storage / S3 later requires no callers to change.

const STORAGE_ROOT = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.STORAGE_DIR ?? "./storage");

const EXT_BY_MIME: Record<string, string> = {
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

export interface SaveResult {
  key: string;
  sizeBytes: number;
}

export async function saveFile(
  subdir: string,
  buffer: Buffer,
  mimeType: string
): Promise<SaveResult> {
  const dir = path.join(/*turbopackIgnore: true*/ STORAGE_ROOT, subdir);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${extensionForMime(mimeType)}`;
  const fullPath = path.join(/*turbopackIgnore: true*/ dir, filename);
  await fs.writeFile(fullPath, buffer);
  return { key: `${subdir}/${filename}`, sizeBytes: buffer.byteLength };
}

export async function readFile(key: string): Promise<Buffer> {
  const fullPath = safeResolve(key);
  return fs.readFile(fullPath);
}

export async function deleteFile(key: string): Promise<void> {
  const fullPath = safeResolve(key);
  await fs.rm(fullPath, { force: true });
}

function safeResolve(key: string): string {
  const fullPath = path.resolve(/*turbopackIgnore: true*/ STORAGE_ROOT, key);
  if (!fullPath.startsWith(STORAGE_ROOT)) {
    throw new Error("Invalid storage key");
  }
  return fullPath;
}

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB

export const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/quicktime", "video/webm"]);
