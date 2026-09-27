"use client";

import { useActionState } from "react";
import { isoToTunisLocalInput, type HoursOverride } from "@/lib/hours-shared";
import { updateHoursOverride, type HoursFormState } from "./actions";

const initialState: HoursFormState = {};

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-brand-green/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/40";

const expiryFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Tunis",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default function OverrideForm({ override, expired }: { override: HoursOverride; expired: boolean }) {
  const [state, formAction, pending] = useActionState(updateHoursOverride, initialState);

  return (
    <form action={formAction} className="bg-white rounded-xl border border-brand-gold/30 p-4 sm:p-6 space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state?.success && !state?.error && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Dérogation mise à jour.
        </p>
      )}
      {override.active && expired && override.expiresAt && !state?.success && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⏱ Cette dérogation a expiré le {expiryFmt.format(new Date(override.expiresAt))} — le site suit à nouveau les
          horaires habituels. Décochez « Activer » ou choisissez une nouvelle date de fin.
        </p>
      )}

      <label className="flex items-center gap-2 text-sm font-semibold text-brand-charcoal">
        <input type="checkbox" name="active" defaultChecked={override.active} className="rounded border-brand-green/30" />
        Activer une dérogation maintenant
      </label>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["open", "🟢", "Ouvert", "exceptionnellement"],
            ["closed", "🔴", "Fermé", "exceptionnellement"],
          ] as const
        ).map(([value, icon, title, sub]) => (
          <label
            key={value}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-brand-green/15 cursor-pointer has-[:checked]:border-brand-green has-[:checked]:bg-brand-green/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-gold/50"
          >
            <input type="radio" name="mode" value={value} defaultChecked={override.mode === value} className="sr-only" />
            <span aria-hidden>{icon}</span>
            <span className="text-sm leading-tight">
              <span className="block font-semibold text-brand-charcoal">{title}</span>
              <span className="block text-[11px] text-brand-charcoal/50">{sub}</span>
            </span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-[11px] text-brand-charcoal/50 mb-1">Raison (optionnel, pour votre suivi)</label>
        <input name="reason" defaultValue={override.reason ?? ""} placeholder="Ex : Soirée spéciale, jour férié…" className={inputCls} />
      </div>

      <div>
        <label className="block text-[11px] text-brand-charcoal/50 mb-1">
          Revenir automatiquement aux horaires normaux le (heure de Tunis, optionnel — sinon désactivez manuellement)
        </label>
        <input
          type="datetime-local"
          name="expiresAt"
          defaultValue={isoToTunisLocalInput(override.expiresAt)}
          className={`${inputCls} sm:w-auto`}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand-gold text-brand-green font-semibold text-sm hover:bg-brand-gold-light transition-colors disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer la dérogation"}
      </button>
    </form>
  );
}
