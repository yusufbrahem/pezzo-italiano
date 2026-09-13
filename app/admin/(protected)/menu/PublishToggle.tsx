"use client";

import { useTransition } from "react";
import { togglePublished } from "./actions";

// One-click visibility switch — flips instantly (optimistic, same pattern as
// SortableCategoryList's drag reorder), no confirmation needed since it's
// non-destructive and trivially reversible. `onToggled` lets the parent list
// patch its own optimistic state immediately, before the server round-trip.
export default function PublishToggle({
  id,
  published,
  onToggled,
}: {
  id: string;
  published: boolean;
  onToggled?: (next: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    const next = !published;
    onToggled?.(next);
    startTransition(() => togglePublished(id, next));
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      aria-pressed={published}
      title={published ? "Visible sur le site — cliquer pour masquer" : "Masqué du site — cliquer pour publier"}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-50 flex-shrink-0 ${
        published
          ? "bg-brand-green/10 text-brand-green hover:bg-brand-green/15"
          : "bg-brand-charcoal/10 text-brand-charcoal/45 hover:bg-brand-charcoal/15"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${published ? "bg-brand-green" : "bg-brand-charcoal/35"}`} />
      {pending ? "..." : published ? "Publié" : "Masqué"}
    </button>
  );
}
