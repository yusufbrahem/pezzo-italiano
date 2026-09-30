import Link from "next/link";
import { getMenuItems } from "@/lib/data/menu";
import { currentStateOf, getVersion, type ContentVersion } from "@/lib/data/versions";
import { menuDataToItem, type MenuItemSnapshot } from "@/lib/menu-apply";
import type { PricingTier } from "@/lib/data/settings";
import type { HoursOverride, HoursSchedule } from "@/lib/hours-shared";
import { menuCategories } from "@/data/menu";
import { DiffTable, OrderLists, contactRows, hoursRows, menuRows, overrideRows, pricingRows, type DiffRow } from "../../../diff";
import RestoreButton from "./RestoreButton";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Tunis",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const OPERATION: Record<ContentVersion["operation"], string> = { create: "Création", update: "Modification", delete: "Suppression" };
const ENTITY: Record<ContentVersion["entity"], string> = {
  menu_item: "Article du menu",
  menu_order: "Ordre du menu",
  coming_soon: "Section « Bientôt disponible »",
  pricing: "Tarifs",
  hours_schedule: "Horaires",
  hours_override: "Ouverture / fermeture exceptionnelle",
  contact: "Coordonnées",
};

/** Rows comparing two states of the same thing (a → b). */
function rowsFor(entity: ContentVersion["entity"], a: unknown, b: unknown): DiffRow[] {
  switch (entity) {
    case "menu_item": {
      const sa = a as MenuItemSnapshot | null;
      const sb = b as MenuItemSnapshot | null;
      return menuRows(sa ? menuDataToItem(sa.id, sa) : null, sb ? menuDataToItem(sb.id, sb) : null);
    }
    case "coming_soon":
      return a === b ? [] : [{ label: "Section « Bientôt disponible »", a: a ? "Affichée" : "Masquée", b: b ? "Affichée" : "Masquée" }];
    case "pricing":
      return pricingRows((a as PricingTier[]) ?? [], (b as PricingTier[]) ?? []);
    case "hours_schedule":
      return hoursRows(a as HoursSchedule | null, b as HoursSchedule | null);
    case "hours_override":
      return overrideRows(a as HoursOverride | null, b as HoursOverride | null);
    case "contact":
      return contactRows(a, b);
    case "menu_order":
      return []; // shown as two lists instead
  }
}

function Compare({
  v,
  a,
  b,
  aLabel,
  bLabel,
  names,
}: {
  v: ContentVersion;
  a: unknown;
  b: unknown;
  aLabel: string;
  bLabel: string;
  names: (id: string) => string;
}) {
  if (v.entity === "menu_order") {
    return <OrderLists a={((a as string[]) ?? []).map(names)} b={((b as string[]) ?? []).map(names)} aLabel={aLabel} bLabel={bLabel} />;
  }
  if (v.entity === "menu_item" && (a === null || b === null)) {
    const present = (a ?? b) as MenuItemSnapshot;
    return (
      <>
        <p className="text-sm text-brand-charcoal/80 mb-3">
          {a === null ? `« ${present.name} » n'existait pas (${aLabel.toLowerCase()}).` : `« ${present.name} » n'existe plus (${bLabel.toLowerCase()}).`}
        </p>
        <DiffTable rows={rowsFor(v.entity, a, b)} aLabel={aLabel} bLabel={bLabel} />
      </>
    );
  }
  return <DiffTable rows={rowsFor(v.entity, a, b)} aLabel={aLabel} bLabel={bLabel} empty="Aucune différence." />;
}

export default async function VersionView({ id }: { id: number }) {
  const v = await getVersion(id);
  if (!v) {
    return (
      <p className="text-sm text-brand-charcoal/70">
        Version introuvable (supprimée après 1 an ?).{" "}
        <Link href="/admin/activity" className="underline">
          Retour à l&apos;historique
        </Link>
      </p>
    );
  }
  const [now, items] = await Promise.all([currentStateOf(v.entity, v.entityId), getMenuItems()]);
  const nameById = new Map(items.map((i) => [i.id, i.name]));
  const names = (i: string) => nameById.get(i) ?? `${i} (supprimé)`;
  const category = v.entity === "menu_order" ? menuCategories.find((c) => c.id === v.entityId)?.labelFr ?? v.entityId : null;

  const restorable = v.operation === "create" || v.before !== null;
  const restoreRows = v.entity === "menu_order" ? null : rowsFor(v.entity, now, v.before);
  const nothingToRestore =
    v.entity === "menu_order"
      ? JSON.stringify(now) === JSON.stringify(v.before)
      : v.entity === "menu_item" && v.operation === "create"
        ? now === null
        : restoreRows !== null && restoreRows.length === 0 && !(v.entity === "menu_item" && now === null);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/activity" className="text-sm text-brand-charcoal/70 hover:text-brand-green">
        ← Historique
      </Link>
      <h1 className="font-serif text-2xl font-bold text-brand-green mt-2 mb-1">
        {OPERATION[v.operation]} — {category ?? v.label}
      </h1>
      <p className="text-sm text-brand-charcoal/70 mb-6">
        {ENTITY[v.entity]} · {dateFmt.format(new Date(v.at))}
        <br />
        Par <strong>{v.authorName ?? "—"}</strong>
        {v.approvedByName && (
          <>
            {" "}
            · validé par <strong>{v.approvedByName}</strong>
          </>
        )}
        {v.restoredFrom && (
          <>
            {" "}
            · restauration de{" "}
            <Link href={`/admin/activity/v/${v.restoredFrom}`} className="underline hover:text-brand-green">
              cette version
            </Link>
          </>
        )}
      </p>

      <section className="bg-white rounded-xl border border-brand-green/10 p-4 sm:p-5 mb-6">
        <h2 className="font-semibold text-brand-charcoal mb-3">Ce qui a changé</h2>
        <Compare v={v} a={v.before} b={v.after} aLabel="Avant" bLabel="Après" names={names} />
      </section>

      <section className="bg-white rounded-xl border border-brand-green/10 p-4 sm:p-5">
        <h2 className="font-semibold text-brand-charcoal mb-1">Restaurer l&apos;état d&apos;avant</h2>
        {!restorable ? (
          <p className="text-sm text-brand-charcoal/70">Aucun état précédent n&apos;a été enregistré pour ce changement.</p>
        ) : nothingToRestore ? (
          <p className="text-sm text-brand-charcoal/70">Le site est déjà dans l&apos;état d&apos;avant ce changement — rien à restaurer.</p>
        ) : (
          <>
            <p className="text-sm text-brand-charcoal/70 mb-4">
              Voici ce que la restauration changerait par rapport au site tel qu&apos;il est maintenant. Elle sera
              enregistrée dans l&apos;historique et pourra elle-même être annulée.
            </p>
            {v.newerCount > 0 && (
              <p className="mb-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠ {v.newerCount} modification{v.newerCount > 1 ? "s plus récentes ont" : " plus récente a"} été faite
                {v.newerCount > 1 ? "s" : ""} depuis sur le même élément — elle{v.newerCount > 1 ? "s" : ""} ser
                {v.newerCount > 1 ? "ont" : "a"} aussi remplacée{v.newerCount > 1 ? "s" : ""}.
              </p>
            )}
            <div className="mb-4">
              <Compare v={v} a={now} b={v.operation === "create" ? null : v.before} aLabel="Maintenant" bLabel="Après restauration" names={names} />
            </div>
            <RestoreButton id={v.id} />
          </>
        )}
      </section>
    </div>
  );
}
