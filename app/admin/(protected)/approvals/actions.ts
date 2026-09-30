"use server";

import { z } from "zod";
import { requireOwner, requireSession } from "@/lib/auth/session";
import { approveChange, rejectChange, withdrawChange, type ReviewResult } from "@/lib/data/changes";
import { sql } from "@/lib/db";
import { logActivity } from "@/lib/data/activity";

async function summaryOf(id: string): Promise<string | null> {
  const rows = await sql`SELECT summary FROM pending_changes WHERE id = ${id}`;
  return (rows[0]?.summary as string) ?? null;
}

const Id = z.string().uuid();

/** Owner only — applies the proposal to the live site. */
export async function approve(id: string): Promise<ReviewResult> {
  const session = await requireOwner();
  if (!Id.safeParse(id).success) return { ok: false, error: "Proposition invalide." };
  const r = await approveChange(id, session.userId);
  if (r.ok) await logActivity({ userId: session.userId, action: "change_approve", target: await summaryOf(id) });
  return r;
}

/** Owner only — the proposal is dropped, with an optional note for the author. */
export async function reject(id: string, note: string): Promise<ReviewResult> {
  const session = await requireOwner();
  if (!Id.safeParse(id).success) return { ok: false, error: "Proposition invalide." };
  const clean = note.trim().slice(0, 500) || null;
  const r = await rejectChange(id, session.userId, clean);
  if (r.ok) await logActivity({ userId: session.userId, action: "change_reject", target: await summaryOf(id), details: { note: clean } });
  return r;
}

/** The author takes back their own proposal. */
export async function withdraw(id: string): Promise<ReviewResult> {
  const session = await requireSession();
  if (!Id.safeParse(id).success) return { ok: false, error: "Proposition invalide." };
  const r = await withdrawChange(id, session.userId);
  if (r.ok) await logActivity({ userId: session.userId, action: "change_withdraw", target: await summaryOf(id) });
  return r;
}
