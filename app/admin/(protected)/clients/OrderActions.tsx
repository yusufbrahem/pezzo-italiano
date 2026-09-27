"use client";

import { useTransition } from "react";
import { markReviewRequested, removeOrder, toggleOrderConfirmed } from "./actions";

export default function OrderActions({
  id,
  customerName,
  isConfirmed,
  reviewRequested,
  reviewUrl,
  canDelete,
}: {
  id: string;
  customerName: string;
  isConfirmed: boolean;
  reviewRequested: boolean;
  reviewUrl: string;
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => toggleOrderConfirmed(id, !isConfirmed))}
        aria-pressed={isConfirmed}
        title={isConfirmed ? "Commande réellement passée — cliquer pour annuler" : "Cocher si la commande a bien été passée"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
          isConfirmed
            ? "bg-brand-green/10 text-brand-green hover:bg-brand-green/15"
            : "border border-brand-green/15 text-brand-charcoal/60 hover:border-brand-green/35"
        }`}
      >
        <span className={`w-3 h-3 rounded border flex items-center justify-center text-[9px] ${isConfirmed ? "bg-brand-green border-brand-green text-white" : "border-brand-charcoal/30"}`}>
          {isConfirmed ? "✓" : ""}
        </span>
        Confirmée
      </button>

      {reviewRequested ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Marquer l'avis comme non demandé ?")) {
              startTransition(() => markReviewRequested(id, false));
            }
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-charcoal/45 hover:text-brand-charcoal/70 disabled:opacity-50"
        >
          Annuler « avis demandé »
        </button>
      ) : (
        // A real link (not window.open) so mobile browsers never block it;
        // the click also records that the review was requested.
        <a
          href={reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => startTransition(() => markReviewRequested(id, true))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1fb855] transition-colors"
        >
          ★ Demander un avis
        </a>
      )}

      {canDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`Supprimer définitivement la commande de "${customerName}" ?`)) {
              startTransition(() => removeOrder(id));
            }
          }}
          className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 disabled:opacity-50"
        >
          {pending ? "..." : "Supprimer"}
        </button>
      )}
    </div>
  );
}
