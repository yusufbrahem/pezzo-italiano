import "server-only";
import { sql } from "@/lib/db";
import type { PricingTiers } from "@/lib/data/settings";
import {
  applyComingSoon,
  applyMenuCreate,
  applyMenuDelete,
  applyMenuUpdate,
  applyPricing,
  applyPublish,
  applyReorder,
  deleteBlobIfOwned,
  revalidateSite,
  rowPhotos,
  type MenuItemData,
} from "@/lib/menu-apply";
import { photosInVersions } from "@/lib/versions-store";

// Owner approval of menu & pricing changes made by staff / administrators.
// A proposal waits in pending_changes until the owner approves it (→ applied
// with the same functions the owner's own edits use) or rejects it. A new
// proposal for the same thing replaces the previous one ("superseded").
// Hours, contact, reviews refresh and order follow-up never go through here.

export type ChangeKind =
  | "menu_create"
  | "menu_update"
  | "menu_delete"
  | "menu_publish"
  | "menu_reorder"
  | "coming_soon"
  | "pricing";

export interface ChangePayloads {
  menu_create: MenuItemData;
  menu_update: MenuItemData;
  menu_delete: { name: string };
  menu_publish: { published: boolean; name: string };
  menu_reorder: { orderedIds: string[] };
  coming_soon: { visible: boolean };
  pricing: { tiers: PricingTiers };
}

export type ChangeStatus = "pending" | "approved" | "rejected" | "superseded" | "withdrawn";

export interface PendingChange<K extends ChangeKind = ChangeKind> {
  id: string;
  kind: K;
  target: string | null;
  payload: ChangePayloads[K];
  summary: string;
  status: ChangeStatus;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toChange(r: any): PendingChange {
  return {
    id: r.id,
    kind: r.kind,
    target: r.target,
    payload: r.payload,
    summary: r.summary,
    status: r.status,
    submittedBy: r.submitted_by,
    submittedByName: r.submitted_by_name ?? "—",
    submittedAt: new Date(r.submitted_at).toISOString(),
    reviewedByName: r.reviewed_by_name ?? null,
    reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null,
    reviewNote: r.review_note ?? null,
  };
}

const SELECT_CHANGES = sql`
  SELECT c.*, s.name AS submitted_by_name, r.name AS reviewed_by_name
  FROM pending_changes c
  JOIN admin_users s ON s.id = c.submitted_by
  LEFT JOIN admin_users r ON r.id = c.reviewed_by
`;

export async function listPendingChanges(): Promise<PendingChange[]> {
  const rows = await sql`${SELECT_CHANGES} WHERE c.status = 'pending' ORDER BY c.submitted_at ASC`;
  return rows.map(toChange);
}

export async function listReviewedChanges(limit = 30): Promise<PendingChange[]> {
  const rows = await sql`${SELECT_CHANGES} WHERE c.status <> 'pending' ORDER BY COALESCE(c.reviewed_at, c.submitted_at) DESC LIMIT ${limit}`;
  return rows.map(toChange);
}

export async function countPendingChanges(): Promise<number> {
  const rows = await sql`SELECT count(*)::int AS n FROM pending_changes WHERE status = 'pending'`;
  return rows[0].n;
}

export async function getPendingChange<K extends ChangeKind>(kind: K, target: string | null): Promise<PendingChange<K> | null> {
  const rows = await sql`${SELECT_CHANGES} WHERE c.status = 'pending' AND c.kind = ${kind} AND COALESCE(c.target, '') = ${target ?? ""} LIMIT 1`;
  return rows[0] ? (toChange(rows[0]) as PendingChange<K>) : null;
}

// ── Photo housekeeping ────────────────────────────────────────────────────
// Photos are uploaded to Blob as soon as they're picked, before approval. When
// a proposal is dropped (rejected / replaced / withdrawn), delete the photos
// only it referenced — never one still used by the menu or another proposal.

function proposalPhotos(c: { kind: ChangeKind; payload: unknown }): string[] {
  if (c.kind !== "menu_create" && c.kind !== "menu_update") return [];
  const d = c.payload as MenuItemData;
  return [d.image, ...(d.extraImages ?? [])].filter((u): u is string => !!u);
}

async function cleanupDroppedPhotos(dropped: { id: string; kind: ChangeKind; payload: unknown }[]) {
  const candidates = new Set(dropped.flatMap(proposalPhotos));
  if (candidates.size === 0) return;
  // Photos any saved version refers to stay too: restoring that version needs them.
  const inUse = await photosInVersions().catch(() => new Set<string>());
  for (const row of await sql`SELECT image, extra_images FROM menu_items`) rowPhotos(row).forEach((u) => inUse.add(u));
  const droppedIds = dropped.map((d) => d.id);
  const open = await sql`
    SELECT id, kind, payload FROM pending_changes
    WHERE status = 'pending' AND kind IN ('menu_create', 'menu_update') AND NOT (id = ANY(${droppedIds}))
  `;
  for (const c of open) proposalPhotos({ kind: c.kind, payload: c.payload }).forEach((u) => inUse.add(u));
  for (const url of candidates) if (!inUse.has(url)) await deleteBlobIfOwned(url);
}

// ── Submit / review ───────────────────────────────────────────────────────

export async function submitChange<K extends ChangeKind>(
  kind: K,
  target: string | null,
  payload: ChangePayloads[K],
  summary: string,
  userId: string
) {
  const replaced =
    kind === "menu_create"
      ? []
      : await sql`SELECT id, kind, payload FROM pending_changes WHERE status = 'pending' AND kind = ${kind} AND COALESCE(target, '') = ${target ?? ""}`;
  const json = JSON.stringify(payload);
  await sql.transaction((tx) => [
    ...replaced.map(
      (r) => tx`UPDATE pending_changes SET status = 'superseded', reviewed_at = now(), review_note = 'Remplacée par une nouvelle proposition' WHERE id = ${r.id}`
    ),
    tx`INSERT INTO pending_changes (kind, target, payload, summary, submitted_by) VALUES (${kind}, ${target}, ${json}::jsonb, ${summary}, ${userId})`,
  ]);
  if (replaced.length) {
    await cleanupDroppedPhotos(replaced.map((r) => ({ id: r.id, kind: r.kind, payload: r.payload })));
  }
  revalidateSite(); // badges / counters in the admin
}

type Dropped = { id: string; kind: ChangeKind; payload: unknown };

async function closeChange(id: string, status: ChangeStatus, reviewerId: string | null, note: string | null): Promise<Dropped | null> {
  const rows = await sql`
    UPDATE pending_changes
    SET status = ${status}, reviewed_by = ${reviewerId}, reviewed_at = now(), review_note = ${note}
    WHERE id = ${id} AND status = 'pending'
    RETURNING id, kind, payload
  `;
  return rows[0] ? { id: rows[0].id, kind: rows[0].kind, payload: rows[0].payload } : null;
}

export type ReviewResult = { ok: true; versionId?: number | null } | { ok: false; error: string };

/** Owner only (checked by the caller). Applies the proposal, then marks it approved. */
export async function approveChange(id: string, ownerId: string): Promise<ReviewResult> {
  const rows = await sql`SELECT * FROM pending_changes WHERE id = ${id} AND status = 'pending'`;
  if (!rows[0]) return { ok: false, error: "Cette proposition a déjà été traitée." };
  const c = toChange(rows[0]);

  // The version records who proposed it and who approved it.
  const meta = { authorId: c.submittedBy, approvedBy: ownerId, changeId: c.id };
  let result: { versionId: number | null } | null = null;
  switch (c.kind) {
    case "menu_create":
      result = await applyMenuCreate(c.payload as MenuItemData, meta);
      break;
    case "menu_update":
      result = await applyMenuUpdate(c.target!, c.payload as MenuItemData, meta);
      break;
    case "menu_delete":
      result = await applyMenuDelete(c.target!, meta);
      break;
    case "menu_publish":
      result = await applyPublish(c.target!, (c.payload as ChangePayloads["menu_publish"]).published, meta);
      break;
    case "menu_reorder":
      result = await applyReorder(c.target!, (c.payload as ChangePayloads["menu_reorder"]).orderedIds, meta);
      break;
    case "coming_soon":
      result = await applyComingSoon((c.payload as ChangePayloads["coming_soon"]).visible, meta);
      break;
    case "pricing":
      result = await applyPricing((c.payload as ChangePayloads["pricing"]).tiers, meta);
      break;
  }

  if (!result) {
    const dropped = await closeChange(id, "rejected", ownerId, "Article introuvable — supprimé entre-temps.");
    if (dropped) await cleanupDroppedPhotos([dropped]);
    revalidateSite();
    return { ok: false, error: "L'article n'existe plus (supprimé entre-temps) — proposition fermée." };
  }
  await closeChange(id, "approved", ownerId, null);

  // A deleted item's other open proposals (edit, publish…) can't apply anymore.
  if (c.kind === "menu_delete") {
    const others = await sql`
      UPDATE pending_changes SET status = 'superseded', reviewed_by = ${ownerId}, reviewed_at = now(), review_note = 'Article supprimé'
      WHERE status = 'pending' AND target = ${c.target} AND kind IN ('menu_update', 'menu_publish')
      RETURNING id, kind, payload
    `;
    if (others.length) await cleanupDroppedPhotos(others.map((o) => ({ id: o.id, kind: o.kind, payload: o.payload })));
  }
  revalidateSite();
  return { ok: true, versionId: result.versionId };
}

export async function rejectChange(id: string, ownerId: string, note: string | null): Promise<ReviewResult> {
  const dropped = await closeChange(id, "rejected", ownerId, note);
  if (!dropped) return { ok: false, error: "Cette proposition a déjà été traitée." };
  await cleanupDroppedPhotos([dropped]);
  revalidateSite();
  return { ok: true };
}

/** The submitter takes back their own proposal. */
export async function withdrawChange(id: string, userId: string): Promise<ReviewResult> {
  const own = await sql`SELECT 1 FROM pending_changes WHERE id = ${id} AND submitted_by = ${userId} AND status = 'pending'`;
  if (!own.length) return { ok: false, error: "Proposition introuvable." };
  const dropped = await closeChange(id, "withdrawn", userId, null);
  if (dropped) await cleanupDroppedPhotos([dropped]);
  revalidateSite();
  return { ok: true };
}
