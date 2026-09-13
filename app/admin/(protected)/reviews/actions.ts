"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";

export async function refreshReviews() {
  await requireSession();
  // updateTag (not revalidateTag) — this runs inside a Server Action and we
  // want the very next request to see fresh data immediately (Next 16+'s
  // read-your-own-writes primitive), not Next's usual stale-while-revalidate.
  updateTag("google-reviews");
  revalidatePath("/", "layout");
}
