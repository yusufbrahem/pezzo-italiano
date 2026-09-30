import { requireSession } from "@/lib/auth/session";
import { getMenuItems } from "@/lib/data/menu";
import { getPricingTiers, getShowComingSoon, type PricingTier } from "@/lib/data/settings";
import { DiffTable, OrderLists, menuRows, pricingRows } from "../diff";
import { listPendingChanges, listReviewedChanges, type ChangePayloads, type PendingChange } from "@/lib/data/changes";
import { menuDataToItem } from "@/lib/menu-apply";
import type { MenuItem } from "@/data/menu";
import ReviewButtons from "./ReviewButtons";

export const metadata = { title: "Validations" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Tunis",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

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
      return <DiffTable rows={menuRows(null, menuDataToItem("new", change.payload as ChangePayloads["menu_create"]))} />;
    case "menu_update":
      if (!live) return <p className="text-sm text-red-700">Cet article n&apos;existe plus.</p>;
      return <DiffTable rows={menuRows(live, menuDataToItem(live.id, change.payload as ChangePayloads["menu_update"]))} />;
    case "menu_delete":
      return (
        <p className="text-sm text-brand-charcoal/80">
          L&apos;article <strong>{(change.payload as ChangePayloads["menu_delete"]).name}</strong> sera retiré du menu
          (il reste restaurable depuis l&apos;Historique).
        </p>
      );
    case "menu_publish": {
      const p = change.payload as ChangePayloads["menu_publish"];
      return (
        <DiffTable
          rows={[{ label: "Visible sur le site", a: live?.isPublished === false ? "Non" : "Oui", b: p.published ? "Oui" : "Non" }]}
        />
      );
    }
    case "menu_reorder": {
      const ids = (change.payload as ChangePayloads["menu_reorder"]).orderedIds;
      const names = (list: string[]) => list.map((id) => items.find((i) => i.id === id)?.name ?? id);
      const current = items.filter((i) => i.category === change.target).map((i) => i.id);
      return <OrderLists a={names(current)} b={names(ids)} aLabel="Actuellement" bLabel="Proposé" />;
    }
    case "coming_soon":
      return (
        <DiffTable
          rows={[
            {
              label: "Section « Bientôt disponible »",
              a: comingSoon ? "Affichée" : "Masquée",
              b: (change.payload as ChangePayloads["coming_soon"]).visible ? "Affichée" : "Masquée",
            },
          ]}
        />
      );
    case "pricing":
      return <DiffTable rows={pricingRows(tiers, (change.payload as ChangePayloads["pricing"]).tiers)} />;
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
