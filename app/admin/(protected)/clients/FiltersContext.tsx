"use client";

import { createContext, useCallback, useContext, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { filtersToSearchParams, type OrderFilters } from "@/lib/orders-filters";

// Filters live in the URL; every control funnels through `update()`, which
// swaps the URL in a transition so the server re-renders the table/stats
// while the old results stay on screen (dimmed) instead of flashing empty.

interface FiltersCtx {
  filters: OrderFilters;
  update: (patch: Partial<OrderFilters>) => void;
  hrefFor: (patch: Partial<OrderFilters>) => string;
  pending: boolean;
}

const Ctx = createContext<FiltersCtx | null>(null);

export function useFilters(): FiltersCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilters must be used inside <FiltersProvider>");
  return ctx;
}

export function FiltersProvider({ filters, children }: { filters: OrderFilters; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const hrefFor = useCallback(
    (patch: Partial<OrderFilters>) => {
      // Any change other than paging sends you back to page 1.
      const resetsPage = Object.keys(patch).some((k) => k !== "page");
      const next = { ...filters, ...(resetsPage ? { page: 1 } : {}), ...patch };
      const qs = filtersToSearchParams(next).toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [filters, pathname]
  );

  const update = useCallback(
    (patch: Partial<OrderFilters>) => {
      startTransition(() => router.replace(hrefFor(patch), { scroll: false }));
    },
    [router, hrefFor]
  );

  return <Ctx.Provider value={{ filters, update, hrefFor, pending }}>{children}</Ctx.Provider>;
}

/** Dims the results while a filter change is loading. */
export function PendingArea({ children }: { children: React.ReactNode }) {
  const { pending } = useFilters();
  return (
    <div aria-busy={pending} className={`transition-opacity duration-150 ${pending ? "opacity-50 pointer-events-none" : ""}`}>
      {children}
    </div>
  );
}
