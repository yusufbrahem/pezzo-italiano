"use client";

import { useActionState, useState } from "react";
import { closesAfterMidnight, type HoursSchedule } from "@/lib/hours-shared";
import { updateHoursSchedule, type HoursFormState } from "./actions";

const DAYS: { key: keyof HoursSchedule; label: string }[] = [
  { key: "Mon", label: "Lundi" },
  { key: "Tue", label: "Mardi" },
  { key: "Wed", label: "Mercredi" },
  { key: "Thu", label: "Jeudi" },
  { key: "Fri", label: "Vendredi" },
  { key: "Sat", label: "Samedi" },
  { key: "Sun", label: "Dimanche" },
];

const initialState: HoursFormState = {};

const timeCls =
  "w-full min-w-0 px-2.5 py-2 rounded-lg border border-brand-green/15 bg-white text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:bg-brand-cream disabled:text-brand-charcoal/30";

export default function ScheduleForm({ schedule }: { schedule: HoursSchedule }) {
  const [state, formAction, pending] = useActionState(updateHoursSchedule, initialState);
  // Controlled only so the UI can react (grey out closed days, flag
  // after-midnight closings); the form still submits its own field values.
  const [days, setDays] = useState(schedule);
  const patch = (key: keyof HoursSchedule, p: Partial<HoursSchedule[keyof HoursSchedule]>) =>
    setDays((d) => ({ ...d, [key]: { ...d[key], ...p } }));

  return (
    <form action={formAction} className="bg-white rounded-xl border border-brand-green/10 p-4 sm:p-6">
      {state?.error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state?.success && !state?.error && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Horaires mis à jour.
        </p>
      )}

      <div className="divide-y divide-brand-green/5">
        {DAYS.map(({ key, label }) => {
          const day = days[key];
          return (
            <div
              key={key}
              className="py-3 first:pt-0 grid grid-cols-[1fr_auto] sm:grid-cols-[7rem_1fr_auto] items-center gap-x-3 gap-y-2"
            >
              <span className={`text-sm font-medium ${day.closed ? "text-brand-charcoal/40" : "text-brand-charcoal"}`}>
                {label}
              </span>
              <label className="sm:order-3 flex items-center gap-1.5 text-xs text-brand-charcoal/60 justify-self-end">
                <input
                  type="checkbox"
                  name={`${key}_closed`}
                  checked={day.closed}
                  onChange={(e) => patch(key, { closed: e.target.checked })}
                  className="rounded border-brand-green/30"
                />
                Fermé ce jour
              </label>
              <div className="col-span-2 sm:col-span-1 sm:order-2 flex items-center gap-2">
                <input
                  type="time"
                  name={`${key}_opens`}
                  value={day.opens}
                  onChange={(e) => patch(key, { opens: e.target.value })}
                  disabled={day.closed}
                  aria-label={`${label} — ouverture`}
                  className={timeCls}
                />
                <span className="text-brand-charcoal/40 text-sm flex-shrink-0">à</span>
                <input
                  type="time"
                  name={`${key}_closes`}
                  value={day.closes}
                  onChange={(e) => patch(key, { closes: e.target.value })}
                  disabled={day.closed}
                  aria-label={`${label} — fermeture`}
                  className={timeCls}
                />
              </div>
              {!day.closed && day.opens && day.closes && closesAfterMidnight(day) && (
                <p className="col-span-2 sm:col-span-3 text-[11px] text-brand-charcoal/50 -mt-1">
                  🌙 Ferme après minuit — reste ouvert jusqu&apos;à {day.closes.replace(":", "h")} la nuit suivante.
                </p>
              )}
              {/* Disabled inputs aren't submitted — keep the times for when the day reopens. */}
              {day.closed && (
                <>
                  <input type="hidden" name={`${key}_opens`} value={day.opens} />
                  <input type="hidden" name={`${key}_closes`} value={day.closes} />
                </>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand-green text-brand-white font-semibold text-sm hover:bg-brand-green-light transition-colors disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer les horaires"}
      </button>
    </form>
  );
}
