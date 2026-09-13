"use client";

import { useActionState } from "react";
import type { HoursSchedule } from "@/lib/hours-shared";
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

export default function ScheduleForm({ schedule }: { schedule: HoursSchedule }) {
  const [state, formAction, pending] = useActionState(updateHoursSchedule, initialState);

  return (
    <form action={formAction} className="bg-white rounded-xl border border-brand-green/10 p-6 space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state?.success && !state?.error && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Horaires mis à jour.
        </p>
      )}

      {DAYS.map(({ key, label }) => {
        const day = schedule[key];
        return (
          <div key={key} className="flex items-center gap-3 flex-wrap">
            <span className="w-24 text-sm font-medium text-brand-charcoal flex-shrink-0">{label}</span>
            <input type="time" name={`${key}_opens`} defaultValue={day.opens} className="input w-28" />
            <span className="text-brand-charcoal/40 text-sm">à</span>
            <input type="time" name={`${key}_closes`} defaultValue={day.closes} className="input w-28" />
            <label className="flex items-center gap-1.5 text-xs text-brand-charcoal/60 ml-2">
              <input type="checkbox" name={`${key}_closed`} defaultChecked={day.closed} className="rounded border-brand-green/30" />
              Fermé ce jour
            </label>
          </div>
        );
      })}

      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 rounded-lg bg-brand-green text-brand-white font-semibold text-sm hover:bg-brand-green-light transition-colors disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer les horaires"}
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
