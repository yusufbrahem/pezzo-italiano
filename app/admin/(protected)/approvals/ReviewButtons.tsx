"use client";

import { useState, useTransition } from "react";
import { approve, reject, withdraw } from "./actions";

// Approve / reject (owner) or withdraw (the author) one proposal.
export default function ReviewButtons({ id, canReview, canWithdraw }: { id: string; canReview: boolean; canWithdraw: boolean }) {
  const [busy, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Erreur.");
    });

  if (!canReview && !canWithdraw) return null;

  return (
    <div className="mt-4">
      {canReview && !rejecting && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => approve(id))}
            className="px-4 py-2 rounded-lg bg-brand-green text-brand-white text-sm font-semibold hover:bg-brand-green-light transition-colors disabled:opacity-60"
          >
            {busy ? "..." : "✓ Valider et publier"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRejecting(true)}
            className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            Refuser
          </button>
        </div>
      )}
      {canReview && rejecting && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Raison (facultatif) — visible par l'auteur"
            className="w-full px-3 py-2 rounded-lg border border-brand-green/15 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => reject(id, note))}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {busy ? "..." : "Confirmer le refus"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setRejecting(false)}
              className="px-4 py-2 rounded-lg text-brand-charcoal/70 text-sm font-medium hover:text-brand-green"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {!canReview && canWithdraw && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm("Retirer cette proposition ?")) run(() => withdraw(id));
          }}
          className="text-sm font-semibold text-brand-charcoal/70 hover:text-red-700 disabled:opacity-60"
        >
          {busy ? "..." : "Retirer ma proposition"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
