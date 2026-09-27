"use client";

import { PAGE_SIZES } from "@/lib/orders-filters";
import { useFilters } from "./FiltersContext";

/** 1 … 4 5 [6] 7 8 … 20 */
function pageList(current: number, count: number): (number | "…")[] {
  const pages = new Set([1, count, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= count - 2) [count - 1, count - 2, count - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const btn =
  "min-w-9 h-9 px-2.5 inline-flex items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-colors";

export default function Pagination({ total }: { total: number }) {
  const { filters, update } = useFilters();
  const count = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, count);
  const first = total === 0 ? 0 : (page - 1) * filters.pageSize + 1;
  const last = Math.min(total, page * filters.pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <div className="flex items-center gap-2 text-sm text-brand-charcoal/55">
        <span className="tabular-nums">
          {first}–{last} sur {total}
        </span>
        <span className="text-brand-charcoal/25">·</span>
        <label className="flex items-center gap-1.5">
          Afficher
          <select
            value={filters.pageSize}
            onChange={(e) => update({ pageSize: Number(e.target.value) })}
            className="px-2 py-1 rounded-md border border-brand-green/15 bg-white text-sm"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          par page
        </label>
      </div>

      {count > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => update({ page: page - 1 })}
            className={`${btn} text-brand-charcoal/60 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent`}
            aria-label="Page précédente"
          >
            ‹
          </button>
          {pageList(page, count).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-brand-charcoal/35">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => update({ page: p })}
                aria-current={p === page ? "page" : undefined}
                className={`${btn} ${p === page ? "bg-brand-green text-brand-white" : "text-brand-charcoal/65 hover:bg-white"}`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            disabled={page >= count}
            onClick={() => update({ page: page + 1 })}
            className={`${btn} text-brand-charcoal/60 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent`}
            aria-label="Page suivante"
          >
            ›
          </button>
        </nav>
      )}
    </div>
  );
}
