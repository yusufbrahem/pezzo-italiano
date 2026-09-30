"use server";

import { z } from "zod";
import { requireOwner, requireSession } from "@/lib/auth/session";
import { approveChange, rejectChange, withdrawChange, type ReviewResult } from "@/lib/data/changes";

const Id = z.string().uuid();

/** Owner only — applies the proposal to the live site. */
export async function approve(id: string): Promise<ReviewResult> {
  const session = await requireOwner();
  if (!Id.safeParse(id).success) return { ok: false, error: "Proposition invalide." };
  return approveChange(id, session.userId);
}

/** Owner only — the proposal is dropped, with an optional note for the author. */
export async function reject(id: string, note: string): Promise<ReviewResult> {
  const session = await requireOwner();
  if (!Id.safeParse(id).success) return { ok: false, error: "Proposition invalide." };
  const clean = note.trim().slice(0, 500) || null;
  return rejectChange(id, session.userId, clean);
}

/** The author takes back their own proposal. */
export async function withdraw(id: string): Promise<ReviewResult> {
  const session = await requireSession();
  if (!Id.safeParse(id).success) return { ok: false, error: "Proposition invalide." };
  return withdrawChange(id, session.userId);
}
