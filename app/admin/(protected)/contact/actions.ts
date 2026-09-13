"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { setContactSettings, type ContactSettings } from "@/lib/data/settings";

const ContactFormSchema = z.object({
  street: z.string().trim().min(1),
  area: z.string().trim().min(1),
  city: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  mapsUrl: z.string().trim().url(),
  mapsEmbedUrl: z.string().trim().min(1),
  phonePrimary: z.string().trim().min(1),
  phoneSecondary: z.string().trim().min(1),
  phonePrimaryFormatted: z.string().trim().min(1),
  phoneSecondaryFormatted: z.string().trim().min(1),
  whatsappNumber: z.string().trim().min(1),
  instagram: z.string().trim().url(),
  facebook: z.string().trim().url(),
});

export interface ContactFormState {
  error?: string;
}

export async function updateContactSettings(
  _prevState: ContactFormState | undefined,
  formData: FormData
): Promise<ContactFormState> {
  const session = await requireSession();
  const parsed = ContactFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Certains champs sont invalides. Vérifiez les URLs (http/https requis)." };
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
  return {};
}
