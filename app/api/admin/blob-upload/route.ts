import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";

// Client-side direct upload — not a server-action put(), because Vercel
// Functions cap request bodies at 4.5 MB on every plan and a phone photo
// is routinely 3-8 MB. The upload bytes never transit this handler; it
// only issues a short-lived, scoped upload token to already-logged-in staff.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // The real authorization boundary: only a logged-in admin gets a
        // token at all. (Not requireSession() — that redirects, which
        // isn't meaningful for a JSON API route.)
        const session = await verifySession();
        if (!session) throw new Error("Not authenticated");
        if (!pathname.startsWith("menu-items/")) {
          throw new Error("Invalid upload path");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 8 * 1024 * 1024, // 8 MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.userId }),
        };
      },
      onUploadCompleted: async () => {
        // Nothing to persist here — the uploaded URL is submitted with the
        // surrounding form and saved to menu_items.image by the caller.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
