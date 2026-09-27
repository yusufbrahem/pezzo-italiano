"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { setHoursSchedule, setHoursOverride } from "@/lib/data/settings";
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

  await setHoursSchedule(schedule, session.userId);
  // "/" and "/admin" are separate root layouts — both need revalidating.
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
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

  await setHoursOverride(value, session.userId);
  // "/" and "/admin" are separate root layouts — both need revalidating.
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return { success: true };
}
