"use client";

import { useOptimistic, useTransition } from "react";
import { setComingSoonVisible } from "./actions";

// On/off switch for the public menu's "Bientôt disponible" section — the
// items marked "Bientôt disponible" in their edit form. Optimistic like
// PublishToggle: flips instantly, the server action follows.
export default function ComingSoonToggle({ visible, itemCount }: { visible: boolean; itemCount: number }) {
  const [shown, setShown] = useOptimistic(visible);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setShown(!shown);
      await setComingSoonVisible(!shown);
    });

  return (
    <div className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-brand-green/10 bg-white px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-charcoal">Section « Bientôt disponible »</p>
        <p className="text-xs text-brand-charcoal/50 mt-0.5">
          {itemCount === 0
            ? "Aucun article n'est marqué « Bientôt disponible » pour l'instant."
            : `${itemCount} article${itemCount > 1 ? "s" : ""} marqué${itemCount > 1 ? "s" : ""} « Bientôt disponible » — ${
                shown ? "visibles sur le site." : "cachés du site."
              }`}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={shown}
        aria-label="Afficher la section « Bientôt disponible » sur le site"
        disabled={pending}
        onClick={toggle}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
          shown ? "bg-brand-green" : "bg-brand-charcoal/20"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${shown ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}
