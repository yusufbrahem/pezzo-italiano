import "server-only";
import { sql } from "@/lib/db";
import {
  applyComingSoon,
  applyContact,
  applyHoursOverride,
  applyHoursSchedule,
  applyMenuDelete,
  applyMenuItemSnapshot,
  applyPricing,
  applyReorder,
  readItemSnapshot,
  type MenuItemSnapshot,
} from "@/lib/menu-apply";
import {
  getContactSettings,
  getHoursOverride,
  getHoursSchedule,
  getPricingTiers,
  getShowComingSoon,
  type ContactSettings,
  type PricingTiers,
} from "@/lib/data/settings";
import type { HoursOverride, HoursSchedule } from "@/lib/hours-shared";
import type { VersionEntity, VersionOperation } from "@/lib/versions-store";

// Reading and restoring content versions (the before/after snapshots written
// by lib/menu-apply.ts). Owner-only at the call sites.

const RETENTION_DAYS = 365;

export interface ContentVersion {
  id: number;
  at: string;
  entity: VersionEntity;
  entityId: string | null;
  label: string;
  operation: VersionOperation;
  before: unknown;
  after: unknown;
  authorName: string | null;
  approvedByName: string | null;
  restoredFrom: number | null;
  newerCount: number; // later versions of the same thing (a restore would overwrite them)
}

export async function getVersion(id: number): Promise<ContentVersion | null> {
  const rows = await sql`
    SELECT v.*, a.name AS author_name, o.name AS approved_by_name,
      (SELECT count(*)::int FROM content_versions n
        WHERE n.entity = v.entity AND COALESCE(n.entity_id, '') = COALESCE(v.entity_id, '') AND n.id > v.id) AS newer_count
    FROM content_versions v
    LEFT JOIN admin_users a ON a.id = v.author_id
    LEFT JOIN admin_users o ON o.id = v.approved_by
    WHERE v.id = ${id}
  `;
  const r = rows[0];
  if (!r) return null;
  return {
    id: Number(r.id),
    at: new Date(r.at).toISOString(),
    entity: r.entity,
    entityId: r.entity_id,
    label: r.label,
    operation: r.operation,
    before: r.before,
    after: r.after,
    authorName: r.author_name,
    approvedByName: r.approved_by_name,
    restoredFrom: r.restored_from ? Number(r.restored_from) : null,
    newerCount: r.newer_count,
  };
}

/** What the thing looks like on the site right now — to compare with what a restore would bring back. */
export async function currentStateOf(entity: VersionEntity, entityId: string | null): Promise<unknown> {
  switch (entity) {
    case "menu_item":
      return entityId ? readItemSnapshot(entityId) : null;
    case "menu_order":
      return (await sql`SELECT id FROM menu_items WHERE category = ${entityId} ORDER BY sort_order, id`).map((r) => r.id as string);
    case "coming_soon":
      return getShowComingSoon();
    case "pricing":
      return getPricingTiers();
    case "hours_schedule":
      return getHoursSchedule();
    case "hours_override":
      return getHoursOverride();
    case "contact":
      return getContactSettings();
  }
}

export type RestoreResult = { ok: true; versionId: number | null } | { ok: false; error: string };

/**
 * Puts back the state from *before* version `id` — for a menu item: its old
 * fields, photos and position (re-created if it was deleted since, removed if
 * that version was its creation). Recorded as a new version itself, so a
 * restore can be undone the same way.
 */
export async function restoreVersion(id: number, ownerId: string): Promise<RestoreResult> {
  const v = await getVersion(id);
  if (!v) return { ok: false, error: "Version introuvable." };
  const meta = { authorId: ownerId, restoredFrom: v.id };

  switch (v.entity) {
    case "menu_item": {
      if (v.operation === "create" || v.before === null) {
        // Undo a creation: the item didn't exist before.
        const r = await applyMenuDelete(v.entityId!, meta);
        return r ? { ok: true, versionId: r.versionId } : { ok: false, error: "L'article n'existe déjà plus." };
      }
      const r = await applyMenuItemSnapshot(v.before as MenuItemSnapshot, meta);
      return { ok: true, versionId: r.versionId };
    }
    case "menu_order": {
      // Old order first, then any item added to the category since, in its current order.
      const current = (await currentStateOf("menu_order", v.entityId)) as string[];
      const old = (v.before as string[]).filter((i) => current.includes(i));
      const ids = [...old, ...current.filter((i) => !old.includes(i))];
      const r = await applyReorder(v.entityId!, ids, meta);
      return { ok: true, versionId: r.versionId };
    }
    case "coming_soon": {
      if (typeof v.before !== "boolean") return { ok: false, error: "Pas d'état précédent enregistré." };
      return { ok: true, versionId: (await applyComingSoon(v.before, meta)).versionId };
    }
    case "pricing": {
      if (!Array.isArray(v.before)) return { ok: false, error: "Pas d'état précédent enregistré." };
      return { ok: true, versionId: (await applyPricing(v.before as PricingTiers, meta)).versionId };
    }
    case "hours_schedule": {
      if (!v.before) return { ok: false, error: "Pas d'état précédent enregistré." };
      return { ok: true, versionId: (await applyHoursSchedule(v.before as HoursSchedule, meta)).versionId };
    }
    case "hours_override": {
      if (!v.before) return { ok: false, error: "Pas d'état précédent enregistré." };
      return { ok: true, versionId: (await applyHoursOverride(v.before as HoursOverride, meta)).versionId };
    }
    case "contact": {
      if (!v.before) return { ok: false, error: "Pas d'état précédent enregistré." };
      return { ok: true, versionId: (await applyContact(v.before as ContactSettings, meta)).versionId };
    }
  }
}

export async function purgeOldVersions() {
  await sql`DELETE FROM content_versions WHERE at < now() - make_interval(days => ${RETENTION_DAYS})`;
}
