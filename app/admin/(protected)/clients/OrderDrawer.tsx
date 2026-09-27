"use client";

import { useEffect, useRef } from "react";
import type { OrderRow } from "@/lib/data/orders";
import { buildReviewRequestUrl } from "@/lib/order";
import { formatDT } from "@/lib/orders-filters";
import { formatLongDateTime, formatPhone } from "./format";
import OrderActions from "./OrderActions";

// Side panel on desktop, bottom sheet on phones. Closes on Esc, backdrop
// click, or when the order disappears from the list (e.g. deleted).
export default function OrderDrawer({
  order,
  onClose,
  canDelete,
}: {
  order: OrderRow | null;
  onClose: () => void;
  canDelete: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = order !== null;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!order) return null;

  const qty = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-drawer-title"
        className="absolute bottom-0 inset-x-0 max-h-[90vh] rounded-t-2xl sm:rounded-none sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] bg-brand-cream shadow-2xl flex flex-col focus:outline-none"
      >
        <div className="bg-brand-green px-5 py-4 flex items-start justify-between gap-3 sm:rounded-none rounded-t-2xl">
          <div className="min-w-0">
            <p className="text-brand-gold/70 text-[10px] uppercase tracking-[0.18em] font-bold">
              Commande · {order.id.slice(0, 8)}
            </p>
            <h2 id="order-drawer-title" className="font-serif text-xl font-bold text-brand-white truncate">
              {order.customerName}
            </h2>
            <p className="text-brand-white/60 text-xs mt-0.5 first-letter:uppercase">{formatLongDateTime(order.createdAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 flex-shrink-0 rounded-full bg-brand-white/10 hover:bg-brand-white/20 text-brand-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Customer */}
          <section className="bg-white rounded-xl border border-brand-green/10 p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-brand-charcoal/45 mb-2">Client</h3>
            <p className="font-semibold text-brand-charcoal">{order.customerName}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mt-1">
              <a href={`tel:+${order.phone}`} className="text-brand-green hover:underline tabular-nums">
                📞 {formatPhone(order.phone)}
              </a>
              <a
                href={`https://wa.me/${order.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1fa855] hover:underline"
              >
                💬 WhatsApp
              </a>
            </div>
            {order.phoneRaw.replace(/\D/g, "") !== order.phone && (
              <p className="text-[11px] text-brand-charcoal/40 mt-1">Saisi : {order.phoneRaw}</p>
            )}
            <p className="text-xs text-brand-charcoal/55 mt-2">
              {order.customerOrderCount > 1
                ? `⭐ Client fidèle — ${order.customerOrderCount} commandes au total`
                : "Première commande"}
            </p>
          </section>

          {/* Items */}
          <section className="bg-white rounded-xl border border-brand-green/10 p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-brand-charcoal/45 mb-2">
              Articles ({qty})
            </h3>
            <ul className="divide-y divide-brand-green/5">
              {order.items.map((item, i) => (
                <li key={i} className="py-2 flex justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-brand-charcoal">
                      {item.customNote ? item.name : `${item.quantity}× ${item.name}`}
                      {item.sizeLabel && <span className="text-brand-charcoal/50"> · {item.sizeLabel}</span>}
                    </p>
                    {item.customNote && <p className="text-xs italic text-brand-charcoal/55 mt-0.5">« {item.customNote} »</p>}
                    {!item.customNote && item.quantity > 1 && item.unitPrice > 0 && (
                      <p className="text-[11px] text-brand-charcoal/40">{formatDT(item.unitPrice)} / unité</p>
                    )}
                  </div>
                  <span className="flex-shrink-0 font-semibold text-brand-charcoal/70 tabular-nums">
                    {item.unitPrice > 0 ? formatDT(item.unitPrice * item.quantity) : "à conf."}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-brand-green/10">
              <span className="text-sm font-semibold text-brand-charcoal">Total</span>
              <span className="font-serif text-xl font-bold text-brand-green tabular-nums">
                {order.total > 0 ? formatDT(order.total) : "À confirmer"}
              </span>
            </div>
            {order.total > 0 && order.hasCustomItems && (
              <p className="text-[11px] text-brand-charcoal/45 text-right">+ plateau varié à confirmer</p>
            )}
          </section>

          {/* Delivery / notes */}
          <section className="bg-white rounded-xl border border-brand-green/10 p-4 text-sm space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-brand-charcoal/45 mb-1">
              {order.orderType === "livraison" ? "🛵 Livraison" : "🏃 À emporter"}
            </h3>
            {order.address && (
              <p className="text-brand-charcoal/80">
                📍 {order.address}
                {order.zone ? `, ${order.zone}` : ""}
              </p>
            )}
            {order.landmark && <p className="text-brand-charcoal/60">🧭 {order.landmark}</p>}
            {order.notes ? (
              <p className="text-brand-charcoal/70">📝 {order.notes}</p>
            ) : (
              <p className="text-brand-charcoal/35">Aucune note</p>
            )}
          </section>

          {/* Follow-up */}
          <section className="bg-white rounded-xl border border-brand-green/10 p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-brand-charcoal/45 mb-2">Suivi</h3>
            {order.reviewRequestedAt && (
              <p className="text-xs text-brand-charcoal/55 mb-3">
                ★ Avis demandé le {formatLongDateTime(order.reviewRequestedAt)}
                {order.reviewRequestedByName ? ` par ${order.reviewRequestedByName}` : ""}
              </p>
            )}
            <OrderActions
              id={order.id}
              customerName={order.customerName}
              isConfirmed={order.isConfirmed}
              reviewRequested={order.reviewRequestedAt !== null}
              reviewUrl={buildReviewRequestUrl(order.customerName, order.phone)}
              canDelete={canDelete}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
