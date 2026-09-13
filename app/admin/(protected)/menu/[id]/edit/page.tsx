import { notFound } from "next/navigation";
import { getMenuItems } from "@/lib/data/menu";
import MenuItemForm from "../../MenuItemForm";
import { updateMenuItem } from "../../actions";

export const metadata = { title: "Modifier un article" };

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await getMenuItems();
  const item = items.find((i) => i.id === id);
  if (!item) notFound();

  const boundAction = updateMenuItem.bind(null, id);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-6">Modifier « {item.name} »</h1>
      <MenuItemForm action={boundAction} item={item} submitLabel="Enregistrer les modifications" />
    </div>
  );
}
