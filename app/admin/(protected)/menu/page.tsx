import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { needsApproval } from "@/lib/auth/roles";
import { getMenuItems } from "@/lib/data/menu";
import { getShowComingSoon } from "@/lib/data/settings";
import { listPendingChanges, type ChangePayloads } from "@/lib/data/changes";
import { menuCategories } from "@/data/menu";
import SortableCategoryList from "./SortableCategoryList";
import ComingSoonToggle from "./ComingSoonToggle";

export const metadata = { title: "Menu" };

const ITEM_NOTE: Partial<Record<string, string>> = {
  menu_update: "Modification en attente",
  menu_delete: "Suppression demandée",
};

export default async function AdminMenuPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const [session, items, showComingSoon, pending, params] = await Promise.all([
    requireSession(),
    getMenuItems(),
    getShowComingSoon(),
    listPendingChanges(),
    searchParams,
  ]);
  const approval = needsApproval(session.role);
  const comingSoonCount = items.filter((i) => i.isComingSoon && i.isPublished !== false).length;

  // What's waiting for the owner, shown next to the things it concerns.
  const notes: Record<string, string[]> = {};
  const reorderNotes: Record<string, string> = {};
  let comingSoonPending: { visible: boolean; by: string } | null = null;
  for (const c of pending) {
    if (c.kind === "menu_publish" && c.target) {
      const p = c.payload as ChangePayloads["menu_publish"];
      (notes[c.target] ??= []).push(p.published ? "Publication demandée" : "Masquage demandé");
    } else if (ITEM_NOTE[c.kind] && c.target) {
      (notes[c.target] ??= []).push(ITEM_NOTE[c.kind]!);
    } else if (c.kind === "menu_reorder" && c.target) {
      reorderNotes[c.target] = `Nouvel ordre proposé par ${c.submittedByName} — en attente de validation`;
    } else if (c.kind === "coming_soon") {
      comingSoonPending = { visible: (c.payload as ChangePayloads["coming_soon"]).visible, by: c.submittedByName };
    }
  }
  const newItems = pending.filter((c) => c.kind === "menu_create");
  const menuPendingCount = pending.filter((c) => c.kind !== "pricing").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-brand-green">Menu</h1>
        <Link
          href="/admin/menu/new"
          className="px-4 py-2 rounded-lg bg-brand-gold text-brand-green text-sm font-semibold hover:bg-brand-gold-light transition-colors"
        >
          + Ajouter un article
        </Link>
      </div>

      {params.sent && (
        <p className="mb-5 text-sm text-green-800 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          ✓ Envoyé au propriétaire pour validation — la modification apparaîtra sur le site une fois approuvée.
        </p>
      )}
      {approval ? (
        <p className="mb-5 text-xs text-brand-charcoal/60 bg-brand-cream border border-brand-green/10 rounded-lg px-3 py-2">
          Vos modifications du menu sont envoyées au propriétaire, qui les valide avant qu&apos;elles soient visibles sur le site.
        </p>
      ) : (
        menuPendingCount > 0 && (
          <Link
            href="/admin/approvals"
            className="mb-5 flex items-center justify-between gap-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 hover:border-amber-300"
          >
            <span>
              <strong>{menuPendingCount}</strong> modification{menuPendingCount > 1 ? "s" : ""} du menu à valider
            </span>
            <span className="font-semibold">Voir →</span>
          </Link>
        )
      )}

      <p className="text-xs text-brand-charcoal/60 mb-6">
        Glissez-déposez avec l&apos;icône ⠿ pour réordonner (au sein d&apos;une même catégorie).
      </p>

      <ComingSoonToggle visible={showComingSoon} itemCount={comingSoonCount} approval={approval} pending={comingSoonPending} />

      {newItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800 mb-3">
            Nouveaux articles en attente de validation ({newItems.length})
          </h2>
          <div className="bg-white rounded-xl border border-amber-200 divide-y divide-amber-100">
            {newItems.map((c) => {
              const d = c.payload as ChangePayloads["menu_create"];
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-11 h-11 rounded-lg bg-brand-cream overflow-hidden flex-shrink-0">
                    {d.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                      <img src={d.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🍕</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-charcoal">{d.name}</p>
                    <p className="text-xs text-brand-charcoal/60">Proposé par {c.submittedByName}</p>
                  </div>
                  <Link href="/admin/approvals" className="text-xs font-semibold text-amber-800 hover:underline flex-shrink-0">
                    {approval ? "En attente" : "Valider →"}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {menuCategories.map((cat) => {
        // getMenuItems() already orders by (category, sort_order)
        const catItems = items.filter((i) => i.category === cat.id);

        if (catItems.length === 0) return null;

        return (
          <section key={cat.id} className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-charcoal/60 mb-3">
              {cat.icon} {cat.labelFr} ({catItems.length})
            </h2>
            {reorderNotes[cat.id] && (
              <p className="mb-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                {reorderNotes[cat.id]}
              </p>
            )}
            <SortableCategoryList
              key={[...catItems].map((i) => i.id).sort().join(",")}
              category={cat.id}
              items={catItems}
              notes={notes}
              approval={approval}
            />
          </section>
        );
      })}
    </div>
  );
}
