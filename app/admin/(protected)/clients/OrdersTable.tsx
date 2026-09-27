"use client";

import { useCallback, useState } from "react";
import type { OrderRow } from "@/lib/data/orders";
import { formatDT } from "@/lib/orders-filters";
import { formatDateTime, formatPhone } from "./format";
import OrderDrawer from "./OrderDrawer";

function StatusPills({ order }: { order: OrderRow }) {
  return (
    <div className="flex flex-wrap gap-1 whitespace-nowrap">
      {order.isConfirmed ? (
        <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase tracking-wide">
          ✓ Confirmée
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded-full bg-brand-charcoal/8 text-brand-charcoal/50 text-[10px] font-bold uppercase tracking-wide">
          En attente
        </span>
      )}
      {order.reviewRequestedAt && (
        <span className="px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-green text-[10px] font-bold uppercase tracking-wide">
          ★ Avis demandé
        </span>
      )}
    </div>
  );
}

export default function OrdersTable({ orders, canDelete }: { orders: OrderRow[]; canDelete: boolean }) {
  // Track the id, not the row: after an action the server re-renders `orders`
  // and the open panel picks up the fresh row automatically.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const close = useCallback(() => setSelectedId(null), []);

  return (
    <>
      {/* Phones: one tappable card per order */}
      <ul className="md:hidden space-y-2">
        {orders.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => setSelectedId(o.id)}
              className={`w-full text-left bg-white rounded-xl border p-3.5 active:bg-brand-cream transition-colors ${
                selectedId === o.id ? "border-brand-gold" : "border-brand-green/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-brand-charcoal truncate">{o.customerName}</span>
                    {o.customerOrderCount > 1 && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-green text-[10px] font-bold">
                        ×{o.customerOrderCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-charcoal/50 mt-0.5 tabular-nums">
                    {formatDateTime(o.createdAt)} · {o.orderType === "livraison" ? "🛵 Livraison" : "🏃 Emporter"}
                  </p>
                </div>
                <span className="flex-shrink-0 font-semibold text-brand-green tabular-nums">
                  {o.total > 0 ? formatDT(o.total) : "à conf."}
                </span>
              </div>
              <p className="text-xs text-brand-charcoal/55 truncate mt-2">
                {o.items.map((i) => (i.customNote ? i.name : `${i.quantity}× ${i.name}`)).join(", ")}
              </p>
              <div className="mt-2">
                <StatusPills order={o} />
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Tablets & desktop: full table */}
      <div className="hidden md:block bg-white rounded-xl border border-brand-green/10 overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-brand-green/10 text-left text-[11px] uppercase tracking-wide text-brand-charcoal/45">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Téléphone</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Articles</th>
              <th className="px-4 py-3 font-semibold text-right">Total</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const qty = o.items.reduce((s, i) => s + i.quantity, 0);
              const summary = o.items
                .map((i) => (i.customNote ? i.name : `${i.quantity}× ${i.name}`))
                .join(", ");
              return (
                <tr
                  key={o.id}
                  tabIndex={0}
                  onClick={() => setSelectedId(o.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(o.id);
                    }
                  }}
                  aria-label={`Voir la commande de ${o.customerName}`}
                  className={`border-b border-brand-green/5 last:border-0 cursor-pointer transition-colors hover:bg-brand-cream focus-visible:bg-brand-cream focus:outline-none ${
                    selectedId === o.id ? "bg-brand-cream" : ""
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-brand-charcoal/60 tabular-nums">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-charcoal truncate max-w-[180px]">{o.customerName}</span>
                      {o.customerOrderCount > 1 && (
                        <span
                          title={`${o.customerOrderCount} commandes au total`}
                          className="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-green text-[10px] font-bold"
                        >
                          ×{o.customerOrderCount}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-brand-charcoal/70 tabular-nums">{formatPhone(o.phone)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{o.orderType === "livraison" ? "🛵 Livraison" : "🏃 Emporter"}</td>
                  <td className="px-4 py-3 text-brand-charcoal/60">
                    <span className="block truncate max-w-[220px]" title={summary}>
                      <span className="font-semibold text-brand-charcoal/80">{qty}</span> · {summary}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-brand-green tabular-nums">
                    {o.total > 0 ? formatDT(o.total) : "à conf."}
                    {o.total > 0 && o.hasCustomItems ? <span className="text-brand-charcoal/40 font-normal"> +?</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPills order={o} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <OrderDrawer order={selected} onClose={close} canDelete={canDelete} />
    </>
  );
}
