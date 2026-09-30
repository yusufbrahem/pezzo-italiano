"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { getHoursSchedule } from "@/lib/data/settings";
import { applyHoursOverride, applyHoursSchedule } from "@/lib/menu-apply";
import { logActivity } from "@/lib/data/activity";
import { tunisLocalInputToIso, type HoursSchedule, type HoursOverride } from "@/lib/hours-shared";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export interface HoursFormState {
  error?: string;
  success?: boolean;
}

export async function updateHoursSchedule(
  _prevState: HoursFormState | undefined,
  formData: FormData
): Promise<HoursFormState> {
  const session = await requireSession();

  const schedule = {} as HoursSchedule;
  for (const day of DAYS) {
    const opens = formData.get(`${day}_opens`);
    const closes = formData.get(`${day}_closes`);
    const closed = formData.get(`${day}_closed`) === "on";
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
    const valid = (v: FormDataEntryValue | null): v is string => typeof v === "string" && hhmm.test(v);
    if (!closed && (!valid(opens) || !valid(closes))) {
      return { error: "Horaires invalides — chaque jour ouvert doit avoir une heure d'ouverture et de fermeture." };
    }
    // A closed day keeps whatever times it had (or a placeholder) for when it reopens.
    schedule[day] = { opens: valid(opens) ? opens : "11:00", closes: valid(closes) ? closes : "23:00", closed };
  }

  const DAY_FR: Record<string, string> = { Mon: "Lundi", Tue: "Mardi", Wed: "Mercredi", Thu: "Jeudi", Fri: "Vendredi", Sat: "Samedi", Sun: "Dimanche" };
  const previous = await getHoursSchedule().catch(() => null);
  const changed = DAYS.filter((d) => JSON.stringify(previous?.[d]) !== JSON.stringify(schedule[d])).map((d) =>
    schedule[d].closed ? `${DAY_FR[d]} : fermé` : `${DAY_FR[d]} : ${schedule[d].opens}–${schedule[d].closes}`
  );
  // Saves a restorable before/after version and revalidates both layouts.
  const r = await applyHoursSchedule(schedule, { authorId: session.userId });
  await logActivity({ userId: session.userId, action: "hours_schedule", details: { changed, version: r.versionId } });
  return { success: true };
}

const OverrideSchema = z.object({
  active: z.boolean(),
  mode: z.enum(["open", "closed"]),
  reason: z.string().trim().optional(),
  expiresAt: z.string().trim().optional(),
});

export async function updateHoursOverride(
  _prevState: HoursFormState | undefined,
  formData: FormData
): Promise<HoursFormState> {
  const session = await requireSession();
  const parsed = OverrideSchema.safeParse({
    active: formData.get("active") === "on",
    mode: formData.get("mode"),
    reason: formData.get("reason") ?? undefined,
    expiresAt: formData.get("expiresAt") ?? undefined,
  });
  if (!parsed.success) return { error: "Données invalides." };

  const value: HoursOverride = {
    active: parsed.data.active,
    mode: parsed.data.mode,
    reason: parsed.data.reason || null,
    expiresAt: null,
  };
  if (parsed.data.expiresAt) {
    // The form's datetime-local value is Tunis time, not the server's (UTC).
    value.expiresAt = tunisLocalInputToIso(parsed.data.expiresAt);
    if (!value.expiresAt) return { error: "Date de fin invalide." };
    if (value.active && new Date(value.expiresAt) <= new Date()) {
      return { error: "La date de fin est déjà passée — choisissez une date future, ou laissez-la vide." };
    }
  }

  const r = await applyHoursOverride(value, { authorId: session.userId });
  await logActivity({
    userId: session.userId,
    action: "hours_override",
    target: value.active ? (value.mode === "open" ? "Ouvert exceptionnellement" : "Fermé exceptionnellement") : "Désactivée",
    details: { reason: value.reason, until: value.expiresAt, version: r.versionId },
  });
  return { success: true };
}
