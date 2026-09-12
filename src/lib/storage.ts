import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getStore } from "@netlify/blobs";
import { put, del } from "@vercel/blob";

// Object storage abstraction with three backends, selected automatically:
//  - Netlify Blobs when running on Netlify (persists across function
//    invocations — local disk on serverless functions is ephemeral and
//    NOT shared between invocations, so it must not be used there).
//  - Vercel Blob when running on Vercel (same reasoning — Vercel's function
//    filesystem is ephemeral too). Unlike Netlify Blobs, Vercel Blob has no
//    "private, get by key" mode: every blob gets a public URL (with a long
//    random-looking pathname when addRandomSuffix isn't disabled). We keep
//    our own authenticated route handlers (/api/media/[id]/file,
//    /api/profile-photo/[userId]) as the only thing clients ever call — they
//    check ownership/relationship first, then fetch the blob server-side and
//    stream the bytes back — so nothing changes for callers of this module
//    or for end users. The one real difference: the blob's own URL is not
//    access-controlled by Vercel itself, only unguessable, unlike Netlify
//    Blobs' or the local filesystem's true "nobody but our server can read
//    this" guarantee.
//  - Local filesystem otherwise (plain dev, or a persistent-disk host).
// Callers (see /api/media, /api/profile-photo, /api/profile/photo) only see
// save/read/delete by key, so this is the single place that needs to change
// to move to a different provider (S3, Supabase Storage, ...) later.

const USE_NETLIFY_BLOBS = !!process.env.NETLIFY;
const USE_VERCEL_BLOBS = !!process.env.VERCEL && !USE_NETLIFY_BLOBS;

function isRemoteUrl(key: string): boolean {
  return key.startsWith("http://") || key.startsWith("https://");
}

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

  if (USE_NETLIFY_BLOBS) {
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
    await blobStore().set(key, arrayBuffer, { metadata: { mimeType } });
    return { key, sizeBytes: buffer.byteLength };
  }

  if (USE_VERCEL_BLOBS) {
    const blob = await put(key, buffer, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
    });
    // Store the full blob URL as the key — readFile/deleteFile below detect
    // it by shape, so callers never need to know which backend is in use.
    return { key: blob.url, sizeBytes: buffer.byteLength };
  }

  const dir = path.join(/*turbopackIgnore: true*/ STORAGE_ROOT, subdir);
  await fs.mkdir(dir, { recursive: true });
  const fullPath = path.join(/*turbopackIgnore: true*/ dir, filename);
  await fs.writeFile(fullPath, buffer);

  return { key, sizeBytes: buffer.byteLength };
}

export async function readFile(key: string): Promise<Buffer> {
  if (isRemoteUrl(key)) {
    const res = await fetch(key);
    if (!res.ok) throw new Error(`Blob not found: ${key}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (USE_NETLIFY_BLOBS) {
    const data = await blobStore().get(key, { type: "arrayBuffer" });
    if (!data) throw new Error(`Blob not found: ${key}`);
    return Buffer.from(data);
  }
  const fullPath = safeResolve(key);
  return fs.readFile(fullPath);
}

export async function deleteFile(key: string): Promise<void> {
  if (isRemoteUrl(key)) {
    await del(key);
    return;
  }
  if (USE_NETLIFY_BLOBS) {
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
