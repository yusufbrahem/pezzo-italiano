"use server";

import { requireSession } from "@/lib/auth/session";
import { logPageView } from "@/lib/data/activity";

/** Called by ActivityPing on every admin page change (navigation history). */
export async function trackAdminPage(path: string) {
  const session = await requireSession();
  if (typeof path !== "string" || !path.startsWith("/admin") || path.length > 200) return;
  await logPageView(session.userId, path);
}
