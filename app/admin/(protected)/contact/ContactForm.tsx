"use client";

import { useActionState, useState } from "react";
import type { ContactSettings } from "@/lib/data/settings";
import { updateContactSettings, type ContactFormState } from "./actions";

const initialState: ContactFormState = {};

export default function ContactForm({ contact }: { contact: ContactSettings }) {
  const [state, formAction, pending] = useActionState(updateContactSettings, initialState);
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(fd) => {
        setSaved(false);
        formAction(fd);
      }}
      className="bg-white rounded-xl border border-brand-green/10 p-6 space-y-6 max-w-2xl"
    >
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {!pending && !state?.error && saved && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Coordonnées mises à jour.
        </p>
      )}

      <fieldset className="border border-brand-green/10 rounded-lg p-4 space-y-3">
        <legend className="text-xs font-semibold text-brand-charcoal/60 px-1">Adresse</legend>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Rue" name="street" defaultValue={contact.address.street} />
          <Field label="Quartier" name="area" defaultValue={contact.address.area} />
          <Field label="Ville" name="city" defaultValue={contact.address.city} />
          <Field label="Code postal" name="postalCode" defaultValue={contact.address.postalCode} />
          <Field label="Pays (code ISO)" name="country" defaultValue={contact.address.country} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Latitude" name="lat" type="number" step="any" defaultValue={String(contact.address.lat)} />
          <Field label="Longitude" name="lng" type="number" step="any" defaultValue={String(contact.address.lng)} />
        </div>
        <Field label="Lien Google Maps (fiche établissement)" name="mapsUrl" defaultValue={contact.address.mapsUrl} />
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">
            URL d&apos;intégration Google Maps (rarement à changer — depuis Maps &rarr; Partager &rarr; Intégrer une carte)
          </label>
          <textarea name="mapsEmbedUrl" defaultValue={contact.address.mapsEmbedUrl} rows={2} className="input" />
        </div>
      </fieldset>

      <fieldset className="border border-brand-green/10 rounded-lg p-4 space-y-3">
        <legend className="text-xs font-semibold text-brand-charcoal/60 px-1">Téléphone</legend>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Numéro principal (format +216...)" name="phonePrimary" defaultValue={contact.phone.primary} />
          <Field label="Affichage" name="phonePrimaryFormatted" defaultValue={contact.phone.primaryFormatted} />
          <Field label="Numéro secondaire (format +216...)" name="phoneSecondary" defaultValue={contact.phone.secondary} />
          <Field label="Affichage" name="phoneSecondaryFormatted" defaultValue={contact.phone.secondaryFormatted} />
        </div>
        <Field
          label="Numéro WhatsApp (sans + ni espaces, ex: 21653086089) — c'est là que les commandes sont envoyées"
          name="whatsappNumber"
          defaultValue={contact.whatsappNumber}
        />
      </fieldset>

      <fieldset className="border border-brand-green/10 rounded-lg p-4 space-y-3">
        <legend className="text-xs font-semibold text-brand-charcoal/60 px-1">Réseaux sociaux</legend>
        <Field label="Instagram" name="instagram" defaultValue={contact.social.instagram} />
        <Field label="Facebook" name="facebook" defaultValue={contact.social.facebook} />
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        onClick={() => setSaved(true)}
        className="px-5 py-2.5 rounded-lg bg-brand-green text-brand-white font-semibold text-sm hover:bg-brand-green-light transition-colors disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
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

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-brand-charcoal/50 mb-1">{label}</label>
      <input name={name} type={type} step={step} defaultValue={defaultValue} required className="input" />
    </div>
  );
}
