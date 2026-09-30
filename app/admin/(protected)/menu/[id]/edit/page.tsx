import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { needsApproval } from "@/lib/auth/roles";
import { getMenuItems } from "@/lib/data/menu";
import { getPendingChange } from "@/lib/data/changes";
import { menuDataToItem } from "@/lib/menu-apply";
import MenuItemForm from "../../MenuItemForm";
import { updateMenuItem } from "../../actions";

export const metadata = { title: "Modifier un article" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Tunis", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, items, pendingUpdate, pendingDelete] = await Promise.all([
    requireSession(),
    getMenuItems(),
    getPendingChange("menu_update", id),
    getPendingChange("menu_delete", id),
  ]);
  const live = items.find((i) => i.id === id);
  if (!live) notFound();
  const approval = needsApproval(session.role);

  // Staff / administrators continue from the proposal already waiting (theirs
  // or a colleague's) instead of the live version; the owner edits the live one.
  const item = approval && pendingUpdate ? menuDataToItem(id, pendingUpdate.payload) : live;
  const boundAction = updateMenuItem.bind(null, id);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-6">Modifier « {live.name} »</h1>

      {pendingDelete && (
        <p className="mb-4 max-w-2xl text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⏳ {pendingDelete.submittedByName} a demandé la suppression de cet article.
        </p>
      )}
      {pendingUpdate &&
        (approval ? (
          <p className="mb-4 max-w-2xl text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⏳ Vous voyez la version proposée par {pendingUpdate.submittedByName} le{" "}
            {dateFmt.format(new Date(pendingUpdate.submittedAt))}, en attente de validation. Enregistrer la remplacera.
          </p>
        ) : (
          <Link
            href="/admin/approvals"
            className="mb-4 max-w-2xl flex items-center justify-between gap-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 hover:border-amber-300"
          >
            <span>
              ⏳ {pendingUpdate.submittedByName} a proposé une modification de cet article. Si vous enregistrez ici, la
              proposition restera en attente.
            </span>
            <span className="font-semibold whitespace-nowrap">Voir →</span>
          </Link>
        ))}
      {approval && !pendingUpdate && (
        <p className="mb-5 max-w-2xl text-xs text-brand-charcoal/60 bg-brand-cream border border-brand-green/10 rounded-lg px-3 py-2">
          Vos modifications seront visibles sur le site une fois validées par le propriétaire.
        </p>
      )}

      <MenuItemForm
        action={boundAction}
        item={item}
        submitLabel={approval ? "Envoyer pour validation" : "Enregistrer les modifications"}
      />
    </div>
  );
}
