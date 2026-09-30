import { requireSession } from "@/lib/auth/session";
import { needsApproval } from "@/lib/auth/roles";
import MenuItemForm from "../MenuItemForm";
import { createMenuItem } from "../actions";

export const metadata = { title: "Ajouter un article" };

export default async function NewMenuItemPage() {
  const session = await requireSession();
  const approval = needsApproval(session.role);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-6">Ajouter un article</h1>
      {approval && (
        <p className="mb-5 max-w-2xl text-xs text-brand-charcoal/60 bg-brand-cream border border-brand-green/10 rounded-lg px-3 py-2">
          Le nouvel article sera visible sur le site une fois validé par le propriétaire.
        </p>
      )}
      <MenuItemForm action={createMenuItem} submitLabel={approval ? "Envoyer pour validation" : "Ajouter au menu"} />
    </div>
  );
}
