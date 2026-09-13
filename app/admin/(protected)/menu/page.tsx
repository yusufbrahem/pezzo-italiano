import Link from "next/link";
import { getMenuItems } from "@/lib/data/menu";
import { menuCategories } from "@/data/menu";
import SortableCategoryList from "./SortableCategoryList";

export const metadata = { title: "Menu" };

export default async function AdminMenuPage() {
  const items = await getMenuItems();

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
      <p className="text-xs text-brand-charcoal/40 mb-6 -mt-3">
        Glissez-déposez avec l&apos;icône ⠿ pour réordonner (au sein d&apos;une même catégorie).
      </p>

      {menuCategories.map((cat) => {
        // getMenuItems() already orders by (category, sort_order)
        const catItems = items.filter((i) => i.category === cat.id);

        if (catItems.length === 0) return null;

        return (
          <section key={cat.id} className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-charcoal/50 mb-3">
              {cat.icon} {cat.labelFr} ({catItems.length})
            </h2>
            <SortableCategoryList
              key={[...catItems].map((i) => i.id).sort().join(",")}
              category={cat.id}
              items={catItems}
            />
          </section>
        );
      })}
    </div>
  );
}
