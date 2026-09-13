import MenuItemForm from "../MenuItemForm";
import { createMenuItem } from "../actions";

export const metadata = { title: "Ajouter un article" };

export default function NewMenuItemPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-6">Ajouter un article</h1>
      <MenuItemForm action={createMenuItem} submitLabel="Ajouter au menu" />
    </div>
  );
}
