"use server";

import { revalidatePath } from "next/cache";
import { requireOwner, requireSession } from "@/lib/auth/session";
import {
  deleteActivityEntry,
  deleteActivityMatching,
  deleteAllActivity,
  logActivity,
  logPageView,
  parseActivityFilters,
} from "@/lib/data/activity";

/** Called by ActivityPing on every admin page change (navigation history). */
export async function trackAdminPage(path: string) {
  const session = await requireSession();
  if (typeof path !== "string" || !path.startsWith("/admin") || path.length > 200) return;
  await logPageView(session.userId, path);
}

export type DeleteResult = { ok: true; deleted: number } | { ok: false; error: string };

// History clean-up — owner only. Each deletion leaves one "Historique nettoyé"
// line (which the owner can delete too), so a clean-up is never invisible.
async function done(ownerId: string, deleted: number, scope: string): Promise<DeleteResult> {
  if (deleted > 0) await logActivity({ userId: ownerId, action: "history_delete", target: scope, details: { rows: deleted } });
  revalidatePath("/admin/activity");
  return { ok: true, deleted };
}

export async function deleteHistoryEntry(id: string): Promise<DeleteResult> {
  await requireOwner();
  const n = await deleteActivityEntry(String(id));
  revalidatePath("/admin/activity");
  return { ok: true, deleted: n }; // a single line isn't worth a trace line of its own
}

/** Deletes every entry matching the filters currently shown (all pages). */
export async function deleteHistoryMatching(params: Record<string, string>, scope: string): Promise<DeleteResult> {
  const session = await requireOwner();
  const f = parseActivityFilters(params ?? {});
  const n = await deleteActivityMatching(f);
  return done(session.userId, n, String(scope).slice(0, 200));
}

export async function deleteHistoryAll(): Promise<DeleteResult> {
  const session = await requireOwner();
  const n = await deleteAllActivity();
  return done(session.userId, n, "Tout l'historique");
}
