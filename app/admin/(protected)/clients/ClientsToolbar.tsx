"use client";

import { useEffect, useRef, useState } from "react";
import {
  DATE_RANGES,
  ORDER_SORTS,
  ORDER_STATUSES,
  RANGE_LABELS,
  SORT_LABELS,
  STATUS_LABELS,
  DEFAULT_FILTERS,
  hasActiveFilters,
  tunisToday,
  type OrderStatus,
} from "@/lib/orders-filters";
import { useFilters } from "./FiltersContext";

const selectCls =
  "px-3 py-2 rounded-lg border border-brand-green/15 bg-white text-sm text-brand-charcoal focus:outline-none focus:border-brand-green/40";

export default function ClientsToolbar({ counts }: { counts: Record<OrderStatus, number> }) {
  const { filters, update, pending } = useFilters();

  // Search applies as you type (debounced), without a submit button.
  const [q, setQ] = useState(filters.q);
  const lastSent = useRef(filters.q);
  useEffect(() => {
    // Keep the box in sync when the URL changes from elsewhere (reset, back button).
    if (filters.q !== lastSent.current) {
      setQ(filters.q);
      lastSent.current = filters.q;
    }
  }, [filters.q]);
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed === lastSent.current) return;
    const t = setTimeout(() => {
      lastSent.current = trimmed;
      update({ q: trimmed });
    }, 300);
    return () => clearTimeout(t);
  }, [q, update]);

  const today = tunisToday();
  // Unsent carts have no status/type/period filters — just search.
  const draftsView = filters.view === "drafts";

  return (
    <div className="space-y-3 mb-5">
      {/* Status tabs with live counts */}
      <div
        className={`flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] ${draftsView ? "hidden" : ""}`}
        role="tablist"
        aria-label="Statut"
      >
        {ORDER_STATUSES.map((s) => {
          const active = filters.status === s;
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => update({ status: s })}
              className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                active ? "bg-brand-green text-brand-white" : "bg-white border border-brand-green/10 text-brand-charcoal/65 hover:border-brand-green/30"
              }`}
            >
              {STATUS_LABELS[s]}
              <span
                className={`min-w-[1.5rem] px-1.5 py-0.5 rounded-full text-[11px] tabular-nums ${
                  active ? "bg-brand-white/15 text-brand-white" : "bg-brand-green/8 text-brand-charcoal/60"
                }`}
              >
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={80}
            placeholder="Rechercher un nom ou un téléphone…"
            aria-label="Rechercher"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-brand-green/15 bg-white text-sm focus:outline-none focus:border-brand-green/40"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/35" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </div>

        {!draftsView && (
        <>
        <select
          value={filters.type}
          onChange={(e) => update({ type: e.target.value as typeof filters.type })}
          aria-label="Type de commande"
          className={selectCls}
        >
          <option value="all">Livraison + À emporter</option>
          <option value="livraison">🛵 Livraison</option>
          <option value="emporter">🏃 À emporter</option>
        </select>

        <select
          value={filters.range}
          onChange={(e) => {
            const range = e.target.value as typeof filters.range;
            update(range === "custom" ? { range, from: filters.from ?? today, to: filters.to ?? today } : { range });
          }}
          aria-label="Période"
          className={selectCls}
        >
          {DATE_RANGES.map((r) => (
            <option key={r} value={r}>
              {RANGE_LABELS[r]}
            </option>
          ))}
        </select>

        {filters.range === "custom" && (
          <div className="flex items-center gap-1.5 text-sm text-brand-charcoal/60">
            <input
              type="date"
              value={filters.from ?? ""}
              max={today}
              onChange={(e) => e.target.value && update({ from: e.target.value })}
              aria-label="Du"
              className={selectCls}
            />
            <span>→</span>
            <input
              type="date"
              value={filters.to ?? ""}
              max={today}
              onChange={(e) => e.target.value && update({ to: e.target.value })}
              aria-label="Au"
              className={selectCls}
            />
          </div>
        )}

        {filters.view === "orders" && (
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as typeof filters.sort })}
            aria-label="Trier par"
            className={selectCls}
          >
            {ORDER_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        )}
        </>
        )}

        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              lastSent.current = "";
              update({ q: "", status: "all", type: "all", range: "all", from: null, to: null, sort: DEFAULT_FILTERS.sort });
            }}
            className="px-3 py-2 text-sm font-semibold text-brand-charcoal/50 hover:text-brand-charcoal"
          >
            Réinitialiser
          </button>
        )}

        <span className={`ml-auto text-xs text-brand-charcoal/40 transition-opacity ${pending ? "opacity-100" : "opacity-0"}`} aria-live="polite">
          {pending ? "Mise à jour…" : ""}
        </span>
      </div>
    </div>
  );
}
