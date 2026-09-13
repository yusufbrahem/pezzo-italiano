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

export interface PricingTier {
  label: string;
  pricePer100g: number;
  itemsLabel: string; // e.g. "Thon · Pepperoni · Jambon"
  tagline: string | null; // short marketing line under the price (Premium/Prestige only)
  priceQuart: number;
  priceDemi: number;
  pricePlateau: number | null; // null = no plateau size offered (e.g. Saumon)
}

export interface PricingTiers {
  classique: PricingTier;
  premium: PricingTier;
  prestige: PricingTier;
  oro: PricingTier;
}

const getSetting = cache(async <T>(key: string): Promise<T | null> => {
  const rows = await sql`SELECT value FROM site_settings WHERE key = ${key}`;
  return (rows[0]?.value as T) ?? null;
});

async function setSetting(key: string, value: unknown, updatedBy: string) {
  const json = JSON.stringify(value);
  await sql`
    INSERT INTO site_settings (key, value, updated_at, updated_by)
    VALUES (${key}, ${json}, now(), ${updatedBy})
    ON CONFLICT (key) DO UPDATE SET value = ${json}, updated_at = now(), updated_by = ${updatedBy}
  `;
}

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

export async function getPricingTiers(): Promise<PricingTiers> {
  const value = await getSetting<PricingTiers>("pricing_tiers");
  if (!value) throw new Error("site_settings.pricing_tiers is missing — run the seed script");
  return value;
}

// ── Mutations (called from admin Server Actions) ──────────────────────────

export async function setContactSettings(value: ContactSettings, updatedBy: string) {
  await setSetting("contact", value, updatedBy);
}

export async function setHoursSchedule(value: HoursSchedule, updatedBy: string) {
  await setSetting("hours_schedule", value, updatedBy);
}

export async function setHoursOverride(value: HoursOverride, updatedBy: string) {
  await setSetting("hours_override", value, updatedBy);
}

export async function setPricingTiers(value: PricingTiers, updatedBy: string) {
  await setSetting("pricing_tiers", value, updatedBy);
}
