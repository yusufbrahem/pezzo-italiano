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

// A visual "look" for the tier card — reuses the 4 card treatments designed
// for Classique/Premium/Prestige/Sélection Oro, but any tier can pick any of
// them (not tied to a fixed key), so the legend stays visually varied no
// matter how many tiers exist.
export const PRICING_TIER_STYLES = ["white", "green", "charcoal", "gold"] as const;
export type PricingTierStyle = (typeof PRICING_TIER_STYLES)[number];

export const PRICING_TIER_ICONS = ["none", "star", "gem", "crown", "leaf", "sparkles", "heart"] as const;
export type PricingTierIcon = (typeof PRICING_TIER_ICONS)[number];

export interface PricingTier {
  id: string; // stable key, used as React key / form field id — not shown to visitors
  label: string;
  itemsLabel: string; // e.g. "Thon · Pepperoni · Jambon"
  tagline: string | null; // short marketing line under the price
  badge: string | null; // small pill above the label, e.g. "Sélection Oro" — optional on any tier
  style: PricingTierStyle;
  icon: PricingTierIcon;
  // Every price is independently optional so a tier can be "per-100g only",
  // "sizes only", or any mix — e.g. Saumon can now have a Plateau price too.
  pricePer100g: number | null;
  priceQuart: number | null;
  priceDemi: number | null;
  pricePlateau: number | null;
}

// Any number of tiers, in display order — no fixed set of keys, so adding a
// new tariff for a new item type is just appending to the array.
export type PricingTiers = PricingTier[];

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
