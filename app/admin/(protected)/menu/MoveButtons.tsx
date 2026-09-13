"use client";

import { useTransition } from "react";
import { moveMenuItem } from "./actions";

export default function MoveButtons({
  id,
  category,
  isFirst,
  isLast,
}: {
  id: string;
  category: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col flex-shrink-0 -space-y-1">
      <button
        type="button"
        disabled={isFirst || pending}
        onClick={() => startTransition(() => moveMenuItem(id, category, "up"))}
        className="text-brand-charcoal/30 hover:text-brand-green disabled:opacity-20 disabled:hover:text-brand-charcoal/30 text-xs leading-none py-0.5"
        aria-label="Monter"
      >
        ▲
      </button>
      <button
        type="button"
        disabled={isLast || pending}
        onClick={() => startTransition(() => moveMenuItem(id, category, "down"))}
        className="text-brand-charcoal/30 hover:text-brand-green disabled:opacity-20 disabled:hover:text-brand-charcoal/30 text-xs leading-none py-0.5"
        aria-label="Descendre"
      >
        ▼
      </button>
    </div>
  );
}
