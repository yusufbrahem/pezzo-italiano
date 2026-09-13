"use client";

import { useActionState } from "react";
import type { PricingTier, PricingTiers } from "@/lib/data/settings";
import { updatePricingTiers, type PricingFormState } from "./actions";

const initialState: PricingFormState = {};

const TIERS: { key: keyof PricingTiers; title: string; hasTagline: boolean; hasPlateau: boolean }[] = [
  { key: "classique", title: "Classique", hasTagline: false, hasPlateau: true },
  { key: "premium", title: "Premium", hasTagline: true, hasPlateau: true },
  { key: "prestige", title: "Prestige", hasTagline: true, hasPlateau: true },
  { key: "oro", title: "Sélection Oro (Saumon)", hasTagline: false, hasPlateau: false },
];

export default function PricingForm({ tiers }: { tiers: PricingTiers }) {
  const [state, formAction, pending] = useActionState(updatePricingTiers, initialState);

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state?.success && !state?.error && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Tarifs mis à jour.
        </p>
      )}

      {TIERS.map(({ key, title, hasTagline, hasPlateau }) => (
        <TierFieldset key={key} prefix={key} title={title} tier={tiers[key]} hasTagline={hasTagline} hasPlateau={hasPlateau} />
      ))}

      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 rounded-lg bg-brand-green text-brand-white font-semibold text-sm hover:bg-brand-green-light transition-colors disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer les tarifs"}
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

function TierFieldset({
  prefix,
  title,
  tier,
  hasTagline,
  hasPlateau,
}: {
  prefix: string;
  title: string;
  tier: PricingTier;
  hasTagline: boolean;
  hasPlateau: boolean;
}) {
  return (
    <fieldset className="border border-brand-green/10 rounded-lg p-4 space-y-3 bg-white">
      <legend className="text-xs font-bold uppercase tracking-wide text-brand-charcoal/60 px-1">{title}</legend>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Nom affiché</label>
          <input name={`${prefix}_label`} defaultValue={tier.label} required className="input" />
        </div>
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Prix / 100g</label>
          <input
            name={`${prefix}_pricePer100g`}
            type="number"
            step="0.1"
            defaultValue={tier.pricePer100g}
            required
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-brand-charcoal/50 mb-1">Pizzas incluses (texte libre)</label>
        <input name={`${prefix}_itemsLabel`} defaultValue={tier.itemsLabel} required className="input" />
      </div>

      {hasTagline && (
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Phrase d&apos;accroche (optionnel)</label>
          <input name={`${prefix}_tagline`} defaultValue={tier.tagline ?? ""} className="input" />
        </div>
      )}

      <div className={`grid gap-3 ${hasPlateau ? "grid-cols-3" : "grid-cols-2"}`}>
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">¼ Plateau</label>
          <input name={`${prefix}_priceQuart`} type="number" step="1" defaultValue={tier.priceQuart} required className="input" />
        </div>
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">½ Plateau</label>
          <input name={`${prefix}_priceDemi`} type="number" step="1" defaultValue={tier.priceDemi} required className="input" />
        </div>
        {hasPlateau && (
          <div>
            <label className="block text-[11px] text-brand-charcoal/50 mb-1">Plateau (vide = non proposé)</label>
            <input
              name={`${prefix}_pricePlateau`}
              type="number"
              step="1"
              defaultValue={tier.pricePlateau ?? ""}
              className="input"
            />
          </div>
        )}
      </div>
    </fieldset>
  );
}
