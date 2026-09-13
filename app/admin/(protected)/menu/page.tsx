import Link from "next/link";
import { getMenuItems } from "@/lib/data/menu";
import { menuCategories } from "@/data/menu";
import DeleteButton from "./DeleteButton";
import MoveButtons from "./MoveButtons";

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

      {menuCategories.map((cat) => {
        // getMenuItems() already orders by (category, sort_order)
        const catItems = items.filter((i) => i.category === cat.id);

        if (catItems.length === 0) return null;

        return (
          <section key={cat.id} className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-charcoal/50 mb-3">
              {cat.icon} {cat.labelFr} ({catItems.length})
            </h2>
            <div className="bg-white rounded-xl border border-brand-green/10 divide-y divide-brand-green/8">
              {catItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <MoveButtons
                    id={item.id}
                    category={item.category}
                    isFirst={idx === 0}
                    isLast={idx === catItems.length - 1}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-brand-charcoal text-sm">{item.name}</span>
                      {item.isComingSoon && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-charcoal/10 text-brand-charcoal/50 font-semibold uppercase">
                          Bientôt
                        </span>
                      )}
                      {item.isNew && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold font-semibold uppercase">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-charcoal/45 truncate max-w-md">{item.description}</p>
                  </div>
                  <span className="text-sm font-semibold text-brand-charcoal/70 flex-shrink-0 whitespace-nowrap">
                    {typeof item.price === "number" ? `${item.price} DT` : item.price}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/menu/${item.id}/edit`}
                      className="text-xs font-semibold text-brand-green hover:text-brand-gold px-2 py-1"
                    >
                      Modifier
                    </Link>
                    <DeleteButton id={item.id} name={item.name} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
