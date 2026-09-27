"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AUDIENCE_RANGES,
  AUDIENCE_RANGE_LABELS,
  audienceSearchParams,
  type AudienceFilters,
} from "@/lib/audience-filters";
import { tunisToday } from "@/lib/orders-filters";

const selectCls =
  "px-3 py-2 rounded-lg border border-brand-green/15 bg-white text-sm text-brand-charcoal focus:outline-none focus:border-brand-green/40";

// Period picker kept in the URL; results re-render on the server inside a
// transition, so the previous numbers stay visible (dimmed) while loading.
export default function AudienceShell({
  filters,
  children,
}: {
  filters: AudienceFilters;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const today = tunisToday();

  const update = (next: AudienceFilters) => {
    const qs = audienceSearchParams(next);
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1 min-w-0 max-w-full overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Période">
          {AUDIENCE_RANGES.filter((r) => r !== "custom").map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={filters.range === r}
              onClick={() => update({ range: r, from: null, to: null })}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filters.range === r
                  ? "bg-brand-green text-brand-white"
                  : "bg-white border border-brand-green/10 text-brand-charcoal/65 hover:border-brand-green/30"
              }`}
            >
              {AUDIENCE_RANGE_LABELS[r]}
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={filters.range === "custom"}
            onClick={() =>
              update({ range: "custom", from: filters.from ?? today, to: filters.to ?? today })
            }
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filters.range === "custom"
                ? "bg-brand-green text-brand-white"
                : "bg-white border border-brand-green/10 text-brand-charcoal/65 hover:border-brand-green/30"
            }`}
          >
            {AUDIENCE_RANGE_LABELS.custom}
          </button>
        </div>

        {filters.range === "custom" && (
          <div className="flex items-center gap-1.5 text-sm text-brand-charcoal/60">
            <input
              type="date"
              value={filters.from ?? ""}
              max={today}
              onChange={(e) => e.target.value && update({ ...filters, from: e.target.value })}
              aria-label="Du"
              className={selectCls}
            />
            <span>→</span>
            <input
              type="date"
              value={filters.to ?? ""}
              max={today}
              onChange={(e) => e.target.value && update({ ...filters, to: e.target.value })}
              aria-label="Au"
              className={selectCls}
            />
          </div>
        )}

        <span
          className={`ml-auto text-xs text-brand-charcoal/40 transition-opacity ${pending ? "opacity-100" : "opacity-0"}`}
          aria-live="polite"
        >
          {pending ? "Mise à jour…" : ""}
        </span>
      </div>

      <div aria-busy={pending} className={`transition-opacity duration-150 ${pending ? "opacity-50 pointer-events-none" : ""}`}>
        {children}
      </div>
    </>
  );
}
