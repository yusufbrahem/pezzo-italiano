"use server";

import { requireOwner } from "@/lib/auth/session";
import { restoreVersion, type RestoreResult } from "@/lib/data/versions";
import { logActivity } from "@/lib/data/activity";

/** Owner only — puts back the state from before version `id` (itself recorded as a new version). */
export async function restore(id: number): Promise<RestoreResult> {
  const session = await requireOwner();
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Version invalide." };
  const r = await restoreVersion(id, session.userId);
  if (r.ok) {
    await logActivity({ userId: session.userId, action: "version_restore", details: { from: id, version: r.versionId } });
  }
  return r;
}
