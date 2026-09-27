"use client";

import { useEffect, useRef, useState } from "react";
import { filtersToSearchParams, hasActiveFilters } from "@/lib/orders-filters";
import { useFilters } from "./FiltersContext";

const BASE = "/api/admin/orders/export";

export default function ExportMenu() {
  const { filters } = useFilters();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filteredHref = () => {
    const p = filtersToSearchParams({ ...filters, page: 1 });
    p.delete("view");
    p.delete("page");
    p.delete("size");
    p.set("scope", "filtered");
    return `${BASE}?${p}`;
  };

  const links = [
    { href: `${BASE}?scope=all`, label: "Toutes les commandes", hint: "Depuis la première commande enregistrée" },
    ...(hasActiveFilters(filters)
      ? [{ href: filteredHref(), label: "Sélection actuelle", hint: "Uniquement les commandes affichées par vos filtres" }]
      : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-green/20 bg-white text-sm font-semibold text-brand-green hover:border-brand-green/40 transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        Exporter
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-brand-green/10 shadow-xl p-1.5 z-40">
          {links.map((l) => (
            <a
              key={l.href}
              role="menuitem"
              href={l.href}
              download
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg hover:bg-brand-cream"
            >
              <span className="block text-sm font-semibold text-brand-charcoal">{l.label}</span>
              <span className="block text-[11px] text-brand-charcoal/45">{l.hint}</span>
            </a>
          ))}
          <p className="px-3 pt-2 pb-1 text-[10px] text-brand-charcoal/35 border-t border-brand-green/5 mt-1">
            Fichier Excel (.xlsx) — 3 onglets : Résumé, Commandes, Articles. S&apos;ouvre aussi dans Google Sheets.
          </p>
        </div>
      )}
    </div>
  );
}
