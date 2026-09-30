"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/data/activity";

export async function refreshReviews() {
  const session = await requireSession();
  await logActivity({ userId: session.userId, action: "reviews_refresh" });
  // updateTag (not revalidateTag) — this runs inside a Server Action and we
  // want the very next request to see fresh data immediately (Next 16+'s
  // read-your-own-writes primitive), not Next's usual stale-while-revalidate.
  updateTag("google-reviews");
  revalidatePath("/", "layout");
}
