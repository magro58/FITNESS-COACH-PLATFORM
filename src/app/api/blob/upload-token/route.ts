import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { ALLOWED_IMAGE_MIME, ALLOWED_VIDEO_MIME, MAX_UPLOAD_BYTES } from "@/lib/mime";

// Issues short-lived client tokens for direct browser -> Vercel Blob uploads
// (see src/lib/upload-client.ts). Only meaningful on Vercel — this endpoint
// is never called from local dev or Netlify, where uploads still go through
// our own server (see /api/media, /api/profile/photo).
export async function POST(request: Request) {
  if (!process.env.VERCEL) {
    return NextResponse.json({ error: "Non disponibile in questo ambiente" }, { status: 404 });
  }

  try {
    const user = await requireUser();
    const body = (await request.json()) as HandleUploadBody;

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Restrict uploads to this user's own namespace — matches the
        // `${subdir}/${userId}` prefix used by saveFile() for server uploads.
        if (!pathname.startsWith(`media/${user.id}/`) && !pathname.startsWith(`photos/${user.id}/`)) {
          throw new Error("Percorso di upload non consentito");
        }
        return {
          allowedContentTypes: [...ALLOWED_IMAGE_MIME, ...ALLOWED_VIDEO_MIME],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
        };
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Errore" }, { status: 400 });
  }
}
