"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { setHoursSchedule, setHoursOverride } from "@/lib/data/settings";
import type { HoursSchedule, HoursOverride } from "@/lib/hours-shared";

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
    if (typeof opens !== "string" || typeof closes !== "string") {
      return { error: "Horaires invalides." };
    }
    schedule[day] = { opens, closes, closed };
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
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt).toISOString() : null,
  };

  await setHoursOverride(value, session.userId);
  // "/" and "/admin" are separate root layouts — both need revalidating.
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return { success: true };
}
