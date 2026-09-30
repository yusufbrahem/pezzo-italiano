import "server-only";
import { sql } from "@/lib/db";

// Writes content_versions rows: a before/after snapshot of every change that
// reaches the public site. Kept separate from lib/data/versions.ts (reading +
// restoring) so lib/menu-apply.ts can record versions without an import cycle.

export type VersionEntity =
  | "menu_item"
  | "menu_order"
  | "coming_soon"
  | "pricing"
  | "hours_schedule"
  | "hours_override"
  | "contact";

export type VersionOperation = "create" | "update" | "delete";

/** Who is behind a change: the author (or proposer), the owner who approved it, where it came from. */
export interface VersionMeta {
  authorId: string | null;
  approvedBy?: string | null;
  changeId?: string | null;
  restoredFrom?: number | null;
}

export async function recordVersion(v: {
  entity: VersionEntity;
  entityId?: string | null;
  label: string;
  operation: VersionOperation;
  before: unknown;
  after: unknown;
  meta: VersionMeta;
}): Promise<number | null> {
  try {
    const rows = await sql`
      INSERT INTO content_versions (entity, entity_id, label, operation, before, after, author_id, approved_by, change_id, restored_from)
      VALUES (
        ${v.entity}, ${v.entityId ?? null}, ${v.label.slice(0, 200)}, ${v.operation},
        ${v.before === null || v.before === undefined ? null : JSON.stringify(v.before)}::jsonb,
        ${v.after === null || v.after === undefined ? null : JSON.stringify(v.after)}::jsonb,
        ${v.meta.authorId}, ${v.meta.approvedBy ?? null}, ${v.meta.changeId ?? null}, ${v.meta.restoredFrom ?? null}
      )
      RETURNING id
    `;
    return Number(rows[0].id);
  } catch (err) {
    // Never fail the actual change because its history couldn't be written.
    console.error("[versions] record failed:", err);
    return null;
  }
}

/** Every photo URL any saved version refers to — such photos must stay in storage (restorable). */
export async function photosInVersions(): Promise<Set<string>> {
  const rows = await sql`
    SELECT DISTINCT url FROM (
      SELECT jsonb_array_elements_text(COALESCE(s->'extraImages', '[]'::jsonb)) AS url
      FROM content_versions, LATERAL (VALUES (before), (after)) AS v(s)
      WHERE entity = 'menu_item' AND s IS NOT NULL
      UNION
      SELECT s->>'image'
      FROM content_versions, LATERAL (VALUES (before), (after)) AS v(s)
      WHERE entity = 'menu_item' AND s IS NOT NULL
    ) t WHERE url IS NOT NULL
  `;
  return new Set(rows.map((r) => r.url as string));
}
