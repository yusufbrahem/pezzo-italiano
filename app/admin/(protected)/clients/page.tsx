import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getOrderAnalytics, getStatusCounts, listOrders } from "@/lib/data/orders";
import { filtersToSearchParams, hasActiveFilters, parseOrderFilters, type OrderFilters } from "@/lib/orders-filters";
import { FiltersProvider, PendingArea } from "./FiltersContext";
import ClientsToolbar from "./ClientsToolbar";
import OrdersTable from "./OrdersTable";
import Pagination from "./Pagination";
import ExportMenu from "./ExportMenu";
import StatsView from "./StatsView";

export const metadata = { title: "Clients" };

function viewHref(filters: OrderFilters, view: OrderFilters["view"]) {
  const qs = filtersToSearchParams({ ...filters, view, page: 1 }).toString();
  return qs ? `/admin/clients?${qs}` : "/admin/clients";
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const filters = parseOrderFilters(await searchParams);
  const isOwner = session.role === "owner";

  const [counts, list, analytics] = await Promise.all([
    getStatusCounts(filters),
    filters.view === "orders" ? listOrders(filters) : null,
    filters.view === "stats" ? getOrderAnalytics(filters) : null,
  ]);

  return (
    <FiltersProvider filters={filters}>
      {/* No wrap: Exporter stays top-right on every width, so its right-anchored
          menu always opens inward, never off the left edge of a phone screen. */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="min-w-0 font-serif text-2xl font-bold text-brand-green">Clients & commandes</h1>
        {isOwner && (
          <div className="flex-shrink-0">
            <ExportMenu />
          </div>
        )}
      </div>
      <p className="text-sm text-brand-charcoal/50 mt-1 mb-5">
        Chaque commande envoyée depuis le site. Cochez « Confirmée » une fois la commande passée, puis demandez un avis
        un jour ou deux plus tard.
      </p>

      <div className="flex gap-6 border-b border-brand-green/10 mb-5" role="tablist" aria-label="Vue">
        {(
          [
            ["orders", "Commandes"],
            ["stats", "Statistiques"],
          ] as const
        ).map(([id, label]) => (
          <Link
            key={id}
            href={viewHref(filters, id)}
            role="tab"
            aria-selected={filters.view === id}
            scroll={false}
            className={`-mb-px pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
              filters.view === id
                ? "border-brand-gold text-brand-green"
                : "border-transparent text-brand-charcoal/45 hover:text-brand-charcoal/75"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <ClientsToolbar counts={counts} />

      <PendingArea>
        {list &&
          (list.orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-green/10 p-10 text-center text-sm text-brand-charcoal/50">
              {hasActiveFilters(filters)
                ? "Aucune commande ne correspond à ces filtres."
                : "Aucune commande enregistrée pour l'instant — elles apparaîtront ici dès qu'un client commandera depuis le site."}
            </div>
          ) : (
            <>
              <OrdersTable orders={list.orders} canDelete={isOwner} />
              <Pagination total={list.total} />
            </>
          ))}
        {analytics && <StatsView a={analytics} limitedTo30Days={filters.range === "all"} />}
      </PendingArea>
    </FiltersProvider>
  );
}
