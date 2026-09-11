import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getStore } from "@netlify/blobs";

// Object storage abstraction with two backends, selected automatically:
//  - Netlify Blobs when running on Netlify (persists across function
//    invocations — local disk on serverless functions is ephemeral and
//    NOT shared between invocations, so it must not be used there).
//  - Local filesystem otherwise (plain dev, or a persistent-disk host).
// Callers (see /api/media, /api/profile-photo, /api/profile/photo) only see
// save/read/delete by key, so this is the single place that needs to change
// to move to a different provider (S3, Supabase Storage, ...) later.

const USE_BLOBS = !!process.env.NETLIFY;

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

function blobStore() {
  return getStore({ name: "fitness-coach-media", consistency: "strong" });
}

export async function saveFile(
  subdir: string,
  buffer: Buffer,
  mimeType: string
): Promise<SaveResult> {
  const filename = `${randomUUID()}.${extensionForMime(mimeType)}`;
  const key = `${subdir}/${filename}`;

  if (USE_BLOBS) {
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
    await blobStore().set(key, arrayBuffer, { metadata: { mimeType } });
  } else {
    const dir = path.join(/*turbopackIgnore: true*/ STORAGE_ROOT, subdir);
    await fs.mkdir(dir, { recursive: true });
    const fullPath = path.join(/*turbopackIgnore: true*/ dir, filename);
    await fs.writeFile(fullPath, buffer);
  }

  return { key, sizeBytes: buffer.byteLength };
}

export async function readFile(key: string): Promise<Buffer> {
  if (USE_BLOBS) {
    const data = await blobStore().get(key, { type: "arrayBuffer" });
    if (!data) throw new Error(`Blob not found: ${key}`);
    return Buffer.from(data);
  }
  const fullPath = safeResolve(key);
  return fs.readFile(fullPath);
}

export async function deleteFile(key: string): Promise<void> {
  if (USE_BLOBS) {
    await blobStore().delete(key);
    return;
  }
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
