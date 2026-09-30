"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { restore } from "./actions";

export default function RestoreButton({ id }: { id: number }) {
  const [busy, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string; versionId?: number | null } | null>(null);

  if (result?.ok) {
    return (
      <p className="text-sm text-green-800 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
        ✓ Restauré — le site est revenu à l&apos;état d&apos;avant.{" "}
        {result.versionId && (
          <Link href={`/admin/activity/v/${result.versionId}`} className="underline font-semibold">
            Voir la restauration (annulable)
          </Link>
        )}
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (!confirm("Restaurer l'état d'avant ce changement ? Le site sera mis à jour immédiatement.")) return;
          startTransition(async () => setResult(await restore(id)));
        }}
        className="px-4 py-2 rounded-lg bg-brand-green text-brand-white text-sm font-semibold hover:bg-brand-green-light transition-colors disabled:opacity-60"
      >
        {busy ? "Restauration..." : "↺ Restaurer l'état d'avant"}
      </button>
      {result && !result.ok && <p className="mt-2 text-sm text-red-700">{result.error}</p>}
    </div>
  );
}
