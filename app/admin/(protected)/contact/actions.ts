"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { setContactSettings, type ContactSettings } from "@/lib/data/settings";

// These values end up in links and an <iframe> on the public site, so only
// real https URLs are accepted (z.url() alone would let "javascript:…" through).
const httpsUrl = (host?: RegExp) =>
  z
    .string()
    .trim()
    .url()
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "https:" && (!host || host.test(u.hostname));
      } catch {
        return false;
      }
    });

const ContactFormSchema = z.object({
  street: z.string().trim().min(1),
  area: z.string().trim().min(1),
  city: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().min(1),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  mapsUrl: httpsUrl(),
  mapsEmbedUrl: httpsUrl(/(^|\.)google\.[a-z.]+$/).refine((v) => new URL(v).pathname.startsWith("/maps/embed")),
  phonePrimary: z.string().trim().regex(/^\+?[\d\s]{8,20}$/),
  phoneSecondary: z.string().trim().regex(/^\+?[\d\s]{8,20}$/),
  phonePrimaryFormatted: z.string().trim().min(1),
  phoneSecondaryFormatted: z.string().trim().min(1),
  // Every website order is sent to wa.me/<this> — it must be digits only.
  // Spaces, "+" or a leading "00" are stripped rather than rejected.
  whatsappNumber: z
    .string()
    .transform((v) => v.replace(/\D/g, "").replace(/^00/, ""))
    .pipe(z.string().regex(/^\d{8,15}$/)),
  instagram: httpsUrl(/(^|\.)instagram\.com$/),
  facebook: httpsUrl(/(^|\.)facebook\.com$/),
});

const FIELD_LABELS: Record<string, string> = {
  street: "Rue",
  area: "Quartier",
  city: "Ville",
  postalCode: "Code postal",
  country: "Pays",
  lat: "Latitude",
  lng: "Longitude",
  mapsUrl: "Lien Google Maps (lien https complet)",
  mapsEmbedUrl: "URL d'intégration Google Maps (doit commencer par https://www.google.com/maps/embed)",
  phonePrimary: "Numéro principal (chiffres, + et espaces uniquement)",
  phoneSecondary: "Numéro secondaire (chiffres, + et espaces uniquement)",
  phonePrimaryFormatted: "Affichage du numéro principal",
  phoneSecondaryFormatted: "Affichage du numéro secondaire",
  whatsappNumber: "Numéro WhatsApp (8 à 15 chiffres)",
  instagram: "Instagram (lien https://instagram.com/…)",
  facebook: "Facebook (lien https://facebook.com/…)",
};

export interface ContactFormState {
  error?: string;
  success?: boolean;
}

export async function updateContactSettings(
  _prevState: ContactFormState | undefined,
  formData: FormData
): Promise<ContactFormState> {
  const session = await requireSession();
  const parsed = ContactFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
    return { error: `À corriger : ${fields.map((f) => FIELD_LABELS[f] ?? f).join(" · ")}` };
  }
  const d = parsed.data;

  const value: ContactSettings = {
    address: {
      street: d.street,
      area: d.area,
      city: d.city,
      postalCode: d.postalCode,
      country: d.country,
      lat: d.lat,
      lng: d.lng,
      mapsUrl: d.mapsUrl,
      mapsEmbedUrl: d.mapsEmbedUrl,
    },
    phone: {
      primary: d.phonePrimary,
      secondary: d.phoneSecondary,
      primaryFormatted: d.phonePrimaryFormatted,
      secondaryFormatted: d.phoneSecondaryFormatted,
    },
    whatsappNumber: d.whatsappNumber,
    social: { instagram: d.instagram, facebook: d.facebook },
  };

  await setContactSettings(value, session.userId);
  // "/" and "/admin" are separate root layouts — both need revalidating.
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return { success: true };
}
