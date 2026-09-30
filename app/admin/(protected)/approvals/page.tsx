import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/session";
import { getMenuItems } from "@/lib/data/menu";
import { getPricingTiers, getShowComingSoon, type PricingTier } from "@/lib/data/settings";
import { listPendingChanges, listReviewedChanges, type ChangePayloads, type PendingChange } from "@/lib/data/changes";
import { menuDataToItem } from "@/lib/menu-apply";
import { getItemPhotos, menuCategories, type MenuItem } from "@/data/menu";
import ReviewButtons from "./ReviewButtons";

export const metadata = { title: "Validations" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Tunis",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dt = (n: number | undefined | null) => (n === undefined || n === null ? "—" : `${n} DT`);
const FLAGS: [keyof MenuItem, string][] = [
  ["isSignature", "Signature"],
  ["isNew", "Nouveau"],
  ["isBestseller", "Coup de cœur"],
  ["isDevPick", "Choix du Dev"],
  ["isVegetarian", "Végétarien"],
  ["isComingSoon", "Bientôt disponible"],
  ["isCustom", "Sur mesure"],
];

// What the approvals page compares, field by field.
const MENU_FIELDS: [string, (i: MenuItem) => string][] = [
  ["Nom", (i) => i.name],
  ["Description", (i) => i.description || "—"],
  ["Catégorie", (i) => menuCategories.find((c) => c.id === i.category)?.labelFr ?? i.category],
  ["Prix", (i) => (typeof i.price === "number" ? dt(i.price) : i.price || "—")],
  ["Prix / 100 g", (i) => dt(i.pricePer100g)],
  ["¼ plateau", (i) => dt(i.priceQuart)],
  ["½ plateau", (i) => dt(i.priceDemi)],
  ["Plateau", (i) => dt(i.pricePlateau)],
  ["Étiquettes", (i) => i.tags?.join(", ") || "—"],
  ["Badges", (i) => FLAGS.filter(([k]) => i[k]).map(([, l]) => l).join(", ") || "—"],
  ["Visible sur le site", (i) => (i.isPublished === false ? "Non" : "Oui")],
  ["Cadrage de la photo", (i) => i.imagePosition || "centre"],
];

const TIER_FIELDS: [string, (t: PricingTier) => string][] = [
  ["Nom", (t) => t.label],
  ["Articles", (t) => t.itemsLabel],
  ["Accroche", (t) => t.tagline || "—"],
  ["Badge", (t) => t.badge || "—"],
  ["Prix / 100 g", (t) => dt(t.pricePer100g)],
  ["¼ plateau", (t) => dt(t.priceQuart)],
  ["½ plateau", (t) => dt(t.priceDemi)],
  ["Plateau", (t) => dt(t.pricePlateau)],
  ["Style", (t) => `${t.style} · icône ${t.icon}`],
];

function DiffTable({ rows }: { rows: { label: string; before: ReactNode; after: ReactNode }[] }) {
  if (rows.length === 0) return <p className="text-sm text-brand-charcoal/60">Aucune différence avec la version en ligne.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wide text-brand-charcoal/60 border-b border-brand-green/10">
          <th className="py-1.5 pr-3 font-semibold w-1/5">Champ</th>
          <th className="py-1.5 pr-3 font-semibold">Actuellement</th>
          <th className="py-1.5 font-semibold">Proposé</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.label}-${i}`} className="border-b border-brand-green/5 last:border-0 align-top">
            <td className="py-2 pr-3 text-brand-charcoal/70">{r.label}</td>
            <td className="py-2 pr-3 text-brand-charcoal/60 line-through decoration-red-300">{r.before}</td>
            <td className="py-2 font-medium text-brand-green">{r.after}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Photos({ urls }: { urls: string[] }) {
  if (urls.length === 0) return <span className="text-brand-charcoal/60">Aucune photo</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {urls.map((u) => (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails
        <img key={u} src={u} alt="" className="w-12 h-12 rounded-md object-cover border border-brand-green/10" />
      ))}
    </span>
  );
}

type DiffRow = { label: string; before: ReactNode; after: ReactNode };

function menuDiff(before: MenuItem | undefined, after: MenuItem) {
  const rows: DiffRow[] = MENU_FIELDS.filter(([, f]) => !before || f(before) !== f(after)).map(([label, f]) => ({
    label,
    before: before ? f(before) : "—",
    after: f(after),
  }));
  const pb = before ? getItemPhotos(before).map((p) => p.src) : [];
  const pa = getItemPhotos(after).map((p) => p.src);
  if (pb.join("|") !== pa.join("|")) rows.push({ label: "Photos", before: <Photos urls={pb} />, after: <Photos urls={pa} /> });
  return rows;
}

function pricingDiff(before: PricingTier[], after: PricingTier[]) {
  const rows: { label: string; before: ReactNode; after: ReactNode }[] = [];
  const byId = new Map(before.map((t) => [t.id, t]));
  for (const t of after) {
    const old = byId.get(t.id);
    if (!old) {
      rows.push({ label: `Nouveau tarif`, before: "—", after: `${t.label} — ${t.itemsLabel}` });
      continue;
    }
    for (const [label, f] of TIER_FIELDS) if (f(old) !== f(t)) rows.push({ label: `${old.label} · ${label}`, before: f(old), after: f(t) });
  }
  for (const t of before) if (!after.some((a) => a.id === t.id)) rows.push({ label: "Tarif retiré", before: t.label, after: "—" });
  if (before.map((t) => t.id).join() !== after.filter((t) => byId.has(t.id)).map((t) => t.id).join() && rows.length === 0) {
    rows.push({ label: "Ordre", before: before.map((t) => t.label).join(" · "), after: after.map((t) => t.label).join(" · ") });
  }
  return rows;
}

function ChangeDetails({
  change,
  items,
  tiers,
  comingSoon,
}: {
  change: PendingChange;
  items: MenuItem[];
  tiers: PricingTier[];
  comingSoon: boolean;
}) {
  const live = change.target ? items.find((i) => i.id === change.target) : undefined;
  switch (change.kind) {
    case "menu_create":
      return <DiffTable rows={menuDiff(undefined, menuDataToItem("new", change.payload as ChangePayloads["menu_create"]))} />;
    case "menu_update":
      if (!live) return <p className="text-sm text-red-700">Cet article n&apos;existe plus.</p>;
      return <DiffTable rows={menuDiff(live, menuDataToItem(live.id, change.payload as ChangePayloads["menu_update"]))} />;
    case "menu_delete":
      return (
        <p className="text-sm text-brand-charcoal/80">
          L&apos;article <strong>{(change.payload as ChangePayloads["menu_delete"]).name}</strong> et ses photos seront
          définitivement supprimés du menu.
        </p>
      );
    case "menu_publish": {
      const p = change.payload as ChangePayloads["menu_publish"];
      return (
        <DiffTable
          rows={[{ label: "Visible sur le site", before: live?.isPublished === false ? "Non" : "Oui", after: p.published ? "Oui" : "Non" }]}
        />
      );
    }
    case "menu_reorder": {
      const ids = (change.payload as ChangePayloads["menu_reorder"]).orderedIds;
      const names = (list: string[]) => list.map((id) => items.find((i) => i.id === id)?.name ?? id);
      const current = items.filter((i) => i.category === change.target).map((i) => i.id);
      return (
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-brand-charcoal/60 font-semibold mb-1">Actuellement</p>
            <ol className="list-decimal list-inside text-brand-charcoal/70">{names(current).map((n, i) => <li key={i}>{n}</li>)}</ol>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-brand-charcoal/60 font-semibold mb-1">Proposé</p>
            <ol className="list-decimal list-inside font-medium text-brand-green">{names(ids).map((n, i) => <li key={i}>{n}</li>)}</ol>
          </div>
        </div>
      );
    }
    case "coming_soon":
      return (
        <DiffTable
          rows={[
            {
              label: "Section « Bientôt disponible »",
              before: comingSoon ? "Affichée" : "Masquée",
              after: (change.payload as ChangePayloads["coming_soon"]).visible ? "Affichée" : "Masquée",
            },
          ]}
        />
      );
    case "pricing":
      return <DiffTable rows={pricingDiff(tiers, (change.payload as ChangePayloads["pricing"]).tiers)} />;
  }
}

const STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: "Validée", cls: "bg-green-50 text-green-800" },
  rejected: { label: "Refusée", cls: "bg-red-50 text-red-700" },
  superseded: { label: "Remplacée", cls: "bg-brand-charcoal/10 text-brand-charcoal/70" },
  withdrawn: { label: "Retirée", cls: "bg-brand-charcoal/10 text-brand-charcoal/70" },
};

export default async function ApprovalsPage() {
  const session = await requireSession();
  const [pending, reviewed, items, tiers, comingSoon] = await Promise.all([
    listPendingChanges(),
    listReviewedChanges(30),
    getMenuItems(),
    getPricingTiers(),
    getShowComingSoon(),
  ]);
  const isOwner = session.role === "owner";

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-2">Validations</h1>
      <p className="text-sm text-brand-charcoal/60 mb-6">
        {isOwner
          ? "Les modifications du menu et des tarifs faites par l'équipe n'apparaissent sur le site qu'après votre validation."
          : "Les modifications du menu et des tarifs sont publiées sur le site après validation par le propriétaire."}
      </p>

      {pending.length === 0 ? (
        <p className="text-sm text-brand-charcoal/60 bg-white rounded-xl border border-brand-green/10 px-4 py-6 text-center mb-10">
          Aucune modification en attente.
        </p>
      ) : (
        <div className="space-y-4 mb-10">
          {pending.map((c) => (
            <article key={c.id} className="bg-white rounded-xl border border-amber-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-3">
                <h2 className="font-semibold text-brand-charcoal">{c.summary}</h2>
                <p className="text-xs text-brand-charcoal/60">
                  {c.submittedByName} · {dateFmt.format(new Date(c.submittedAt))}
                </p>
              </div>
              <ChangeDetails change={c} items={items} tiers={tiers} comingSoon={comingSoon} />
              <ReviewButtons id={c.id} canReview={isOwner} canWithdraw={c.submittedBy === session.userId} />
            </article>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 className="font-semibold text-brand-charcoal mb-3">Historique</h2>
          <div className="bg-white rounded-xl border border-brand-green/10 divide-y divide-brand-green/8">
            {reviewed.map((c) => (
              <div key={c.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${STATUS[c.status]?.cls ?? ""}`}>
                    {STATUS[c.status]?.label ?? c.status}
                  </span>
                  <span className="font-medium text-brand-charcoal">{c.summary}</span>
                </div>
                <p className="text-xs text-brand-charcoal/60 mt-0.5">
                  Proposé par {c.submittedByName} · {dateFmt.format(new Date(c.submittedAt))}
                  {c.reviewedAt && c.reviewedByName && ` · ${STATUS[c.status]?.label ?? ""} par ${c.reviewedByName} le ${dateFmt.format(new Date(c.reviewedAt))}`}
                </p>
                {c.reviewNote && <p className="text-xs text-brand-charcoal/70 mt-1 italic">« {c.reviewNote} »</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
