"use client";

import { useActionState, useId, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { PricingTier, PricingTierIcon, PricingTierStyle, PricingTiers } from "@/lib/data/settings";
import { updatePricingTiers, type PricingFormState } from "./actions";

const initialState: PricingFormState = {};

const STYLE_OPTIONS: { value: PricingTierStyle; label: string }[] = [
  { value: "white", label: "Blanc (discret)" },
  { value: "green", label: "Vert (mis en avant)" },
  { value: "charcoal", label: "Charbon (premium sombre)" },
  { value: "gold", label: "Or (le plus prestigieux)" },
];

const ICON_OPTIONS: { value: PricingTierIcon; label: string }[] = [
  { value: "none", label: "Aucune" },
  { value: "star", label: "Étoile" },
  { value: "gem", label: "Gemme" },
  { value: "crown", label: "Couronne" },
  { value: "leaf", label: "Feuille" },
  { value: "sparkles", label: "Étincelles" },
  { value: "heart", label: "Cœur" },
];

function blankTier(id: string): PricingTier {
  return {
    id,
    label: "Nouveau tarif",
    itemsLabel: "",
    tagline: null,
    badge: null,
    style: "white",
    icon: "none",
    pricePer100g: null,
    priceQuart: null,
    priceDemi: null,
    pricePlateau: null,
  };
}

export default function PricingForm({ tiers: initialTiers }: { tiers: PricingTiers }) {
  const [state, formAction, pending] = useActionState(updatePricingTiers, initialState);
  const [tiers, setTiers] = useState<PricingTiers>(initialTiers);
  const reactId = useId();

  const update = (index: number, patch: Partial<PricingTier>) => {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const remove = (index: number) => {
    const tier = tiers[index];
    if (!window.confirm(`Supprimer le tarif « ${tier.label} » ?`)) return;
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: -1 | 1) => {
    setTiers((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addTier = () => {
    const id = `tier-${reactId}-${Date.now()}`;
    setTiers((prev) => [...prev, blankTier(id)]);
  };

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <input type="hidden" name="tiers" value={JSON.stringify(tiers)} />

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state?.success && !state?.error && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Tarifs mis à jour.
        </p>
      )}

      {tiers.map((tier, index) => (
        <TierFieldset
          key={tier.id}
          tier={tier}
          isFirst={index === 0}
          isLast={index === tiers.length - 1}
          onChange={(patch) => update(index, patch)}
          onRemove={() => remove(index)}
          onMoveUp={() => move(index, -1)}
          onMoveDown={() => move(index, 1)}
        />
      ))}

      <button
        type="button"
        onClick={addTier}
        className="w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-brand-green/25 text-brand-green text-sm font-semibold hover:border-brand-green/50 hover:bg-brand-green/5 transition-colors"
      >
        + Ajouter un tarif
      </button>

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
  tier,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  tier: PricingTier;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<PricingTier>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  // Empty string in a number input means "not offered" — stored as null.
  const numOrNull = (raw: string): number | null => (raw.trim() === "" ? null : Number(raw));

  return (
    <fieldset className="border border-brand-green/10 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-xs font-bold uppercase tracking-wide text-brand-charcoal/60 px-1">
          {tier.label || "Tarif"}
        </legend>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Monter"
            className="p-1.5 rounded text-brand-charcoal/40 hover:text-brand-green hover:bg-brand-green/5 disabled:opacity-20 disabled:hover:bg-transparent"
          >
            <ChevronUp size={15} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Descendre"
            className="p-1.5 rounded text-brand-charcoal/40 hover:text-brand-green hover:bg-brand-green/5 disabled:opacity-20 disabled:hover:bg-transparent"
          >
            <ChevronDown size={15} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Supprimer ce tarif"
            className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Nom affiché</label>
          <input
            value={tier.label}
            onChange={(e) => onChange({ label: e.target.value })}
            required
            className="input"
          />
        </div>
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Prix / 100g (vide = non affiché)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={tier.pricePer100g ?? ""}
            onChange={(e) => onChange({ pricePer100g: numOrNull(e.target.value) })}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-brand-charcoal/50 mb-1">Articles inclus (texte libre)</label>
        <input
          value={tier.itemsLabel}
          onChange={(e) => onChange({ itemsLabel: e.target.value })}
          required
          className="input"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Phrase d&apos;accroche (optionnel)</label>
          <input
            value={tier.tagline ?? ""}
            onChange={(e) => onChange({ tagline: e.target.value || null })}
            className="input"
          />
        </div>
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">
            Badge (optionnel, ex. &quot;Sélection Oro&quot;)
          </label>
          <input
            value={tier.badge ?? ""}
            onChange={(e) => onChange({ badge: e.target.value || null })}
            className="input"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Style de la carte</label>
          <select
            value={tier.style}
            onChange={(e) => onChange({ style: e.target.value as PricingTierStyle })}
            className="input"
          >
            {STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Icône</label>
          <select
            value={tier.icon}
            onChange={(e) => onChange({ icon: e.target.value as PricingTierIcon })}
            className="input"
          >
            {ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-[11px] text-brand-charcoal/50 mb-1">
          Prix par taille — laissez vide une taille non proposée pour ce tarif
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] text-brand-charcoal/40 mb-1">¼ Plateau</label>
            <input
              type="number"
              step="1"
              min="0"
              value={tier.priceQuart ?? ""}
              onChange={(e) => onChange({ priceQuart: numOrNull(e.target.value) })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-[10px] text-brand-charcoal/40 mb-1">½ Plateau</label>
            <input
              type="number"
              step="1"
              min="0"
              value={tier.priceDemi ?? ""}
              onChange={(e) => onChange({ priceDemi: numOrNull(e.target.value) })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-[10px] text-brand-charcoal/40 mb-1">Plateau</label>
            <input
              type="number"
              step="1"
              min="0"
              value={tier.pricePlateau ?? ""}
              onChange={(e) => onChange({ pricePlateau: numOrNull(e.target.value) })}
              className="input"
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
