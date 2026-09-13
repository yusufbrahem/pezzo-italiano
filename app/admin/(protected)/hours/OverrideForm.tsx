"use client";

import { useActionState } from "react";
import type { HoursOverride } from "@/lib/hours-shared";
import { updateHoursOverride, type HoursFormState } from "./actions";

const initialState: HoursFormState = {};

// datetime-local inputs need "YYYY-MM-DDTHH:mm", not a full ISO string
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OverrideForm({ override }: { override: HoursOverride }) {
  const [state, formAction, pending] = useActionState(updateHoursOverride, initialState);

  return (
    <form action={formAction} className="bg-white rounded-xl border border-brand-gold/30 p-6 space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state?.success && !state?.error && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Dérogation mise à jour.
        </p>
      )}

      <label className="flex items-center gap-2 text-sm font-semibold text-brand-charcoal">
        <input type="checkbox" name="active" defaultChecked={override.active} className="rounded border-brand-green/30" />
        Activer une dérogation maintenant
      </label>

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" name="mode" value="open" defaultChecked={override.mode === "open"} />
          Ouvert exceptionnellement
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="mode" value="closed" defaultChecked={override.mode === "closed"} />
          Fermé exceptionnellement
        </label>
      </div>

      <div>
        <label className="block text-[11px] text-brand-charcoal/50 mb-1">Raison (optionnel, pour votre suivi)</label>
        <input name="reason" defaultValue={override.reason ?? ""} className="input w-full" />
      </div>

      <div>
        <label className="block text-[11px] text-brand-charcoal/50 mb-1">
          Revenir automatiquement aux horaires normaux à (optionnel — sinon, désactivez manuellement)
        </label>
        <input type="datetime-local" name="expiresAt" defaultValue={toLocalInputValue(override.expiresAt)} className="input" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 rounded-lg bg-brand-gold text-brand-green font-semibold text-sm hover:bg-brand-gold-light transition-colors disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer la dérogation"}
      </button>

      <style jsx global>{`
        .input {
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(13 59 46 / 0.15);
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgb(201 168 76 / 0.4);
        }
      `}</style>
    </form>
  );
}
