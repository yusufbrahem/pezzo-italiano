"use client";

import { useState, useTransition } from "react";
import { deleteHistoryAll, deleteHistoryEntry, deleteHistoryMatching, type DeleteResult } from "./actions";

// Owner-only clean-up of the activity history. Deletes history lines only —
// saved before/after versions stay restorable.

export function HistoryCleanup({
  params,
  scope,
  matching,
  total,
}: {
  params: Record<string, string>;
  scope: string; // human description of the current filters
  matching: number; // entries matching the current filters
  total: number; // entries in the whole history
}) {
  const [busy, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = (question: string, fn: () => Promise<DeleteResult>) => {
    if (!confirm(question)) return;
    startTransition(async () => {
      const r = await fn();
      setMsg(r.ok ? `✓ ${r.deleted} entrée${r.deleted > 1 ? "s" : ""} supprimée${r.deleted > 1 ? "s" : ""}.` : r.error);
    });
  };

  return (
    <details className="mb-5 bg-white rounded-xl border border-brand-green/10 px-4 py-3">
      <summary className="text-sm font-semibold text-brand-charcoal cursor-pointer">🧹 Nettoyer l&apos;historique</summary>
      <div className="mt-3 space-y-3 text-sm">
        <p className="text-xs text-brand-charcoal/70">
          Supprime des lignes de l&apos;historique. Les versions enregistrées des modifications restent restaurables. Une
          ligne « Historique nettoyé » garde la trace du nettoyage (vous pouvez aussi la supprimer).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy || matching === 0}
            onClick={() =>
              run(
                `Supprimer définitivement les ${matching} entrée${matching > 1 ? "s" : ""} affichée${matching > 1 ? "s" : ""} (${scope}) ?`,
                () => deleteHistoryMatching(params, scope)
              )
            }
            className="px-3.5 py-2 rounded-lg border border-red-200 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-50"
          >
            Supprimer les {matching} entrée{matching > 1 ? "s" : ""} affichée{matching > 1 ? "s" : ""}
          </button>
          <span className="text-xs text-brand-charcoal/60">{scope}</span>
        </div>
        <div>
          <button
            type="button"
            disabled={busy || total === 0}
            onClick={() =>
              run(
                `Effacer TOUT l'historique (${total} entrée${total > 1 ? "s" : ""}, tous les membres, toutes les dates) ? Action définitive.`,
                () => deleteHistoryAll()
              )
            }
            className="px-3.5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            Tout effacer ({total})
          </button>
        </div>
        {msg && <p className="text-sm text-green-800">{msg}</p>}
      </div>
    </details>
  );
}

export function DeleteEntryButton({ id }: { id: string }) {
  const [busy, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        if (confirm("Supprimer cette ligne de l'historique ?")) {
          startTransition(async () => {
            await deleteHistoryEntry(id);
          });
        }
      }}
      aria-label="Supprimer cette ligne"
      title="Supprimer cette ligne"
      className="p-1.5 -m-1 rounded text-brand-charcoal/40 hover:text-red-700 hover:bg-red-50 disabled:opacity-40"
    >
      {busy ? "…" : "🗑"}
    </button>
  );
}
