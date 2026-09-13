import "server-only";
import { cache } from "react";
import { sql } from "@/lib/db";
import type { HoursSchedule, HoursOverride } from "@/lib/hours-shared";

export interface ContactSettings {
  address: {
    street: string;
    area: string;
    city: string;
    postalCode: string;
    country: string;
    lat: number;
    lng: number;
    mapsUrl: string; // Google Maps place page link
    mapsEmbedUrl: string; // Google Maps embed iframe src
  };
  phone: {
    primary: string;
    secondary: string;
    primaryFormatted: string;
    secondaryFormatted: string;
  };
  whatsappNumber: string;
  social: { instagram: string; facebook: string };
}

const getSetting = cache(async <T>(key: string): Promise<T | null> => {
  const rows = await sql`SELECT value FROM site_settings WHERE key = ${key}`;
  return (rows[0]?.value as T) ?? null;
});

export async function getContactSettings(): Promise<ContactSettings> {
  const value = await getSetting<ContactSettings>("contact");
  if (!value) throw new Error("site_settings.contact is missing — run the seed script");
  return value;
}

export async function getHoursSchedule(): Promise<HoursSchedule> {
  const value = await getSetting<HoursSchedule>("hours_schedule");
  if (!value) throw new Error("site_settings.hours_schedule is missing — run the seed script");
  return value;
}

export async function getHoursOverride(): Promise<HoursOverride> {
  const value = await getSetting<HoursOverride>("hours_override");
  return value ?? { active: false, mode: "open", reason: null, expiresAt: null };
}

// ── Mutations (called from admin Server Actions) ──────────────────────────

export async function setContactSettings(value: ContactSettings, updatedBy: string) {
  await sql`
    INSERT INTO site_settings (key, value, updated_at, updated_by)
    VALUES ('contact', ${JSON.stringify(value)}, now(), ${updatedBy})
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = now(), updated_by = ${updatedBy}
  `;
}

export async function setHoursSchedule(value: HoursSchedule, updatedBy: string) {
  await sql`
    INSERT INTO site_settings (key, value, updated_at, updated_by)
    VALUES ('hours_schedule', ${JSON.stringify(value)}, now(), ${updatedBy})
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = now(), updated_by = ${updatedBy}
  `;
}

export async function setHoursOverride(value: HoursOverride, updatedBy: string) {
  await sql`
    INSERT INTO site_settings (key, value, updated_at, updated_by)
    VALUES ('hours_override', ${JSON.stringify(value)}, now(), ${updatedBy})
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = now(), updated_by = ${updatedBy}
  `;
}
