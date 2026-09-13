"use client";

import { useActionState } from "react";
import type { MenuItem } from "@/data/menu";
import { menuCategories } from "@/data/menu";
import ImageUpload from "./ImageUpload";

interface FormState {
  error?: string;
}

interface MenuItemFormProps {
  action: (prevState: FormState | undefined, formData: FormData) => Promise<FormState | undefined>;
  item?: MenuItem;
  submitLabel: string;
}

function field(item: MenuItem | undefined, key: keyof MenuItem): string {
  const v = item?.[key];
  return v === undefined || v === null ? "" : String(v);
}

export default function MenuItemForm({ action, item, submitLabel }: MenuItemFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="bg-white rounded-xl border border-brand-green/10 p-6 space-y-5 max-w-2xl">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-brand-charcoal/60 mb-1.5">Nom</label>
          <input name="name" defaultValue={field(item, "name")} required className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-charcoal/60 mb-1.5">Catégorie</label>
          <select name="category" defaultValue={item?.category ?? "pizza"} className="input">
            {menuCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.labelFr}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-brand-charcoal/60 mb-1.5">Description</label>
        <textarea name="description" defaultValue={field(item, "description")} rows={2} className="input" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-brand-charcoal/60 mb-1.5">Photo</label>
        <ImageUpload initialUrl={item?.image} />
      </div>

      <fieldset className="border border-brand-green/10 rounded-lg p-4">
        <legend className="text-xs font-semibold text-brand-charcoal/60 px-1">Prix (DT)</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-brand-charcoal/50 mb-1">Texte (ex: &quot;dès 20 DT&quot;)</label>
            <input name="priceText" defaultValue={typeof item?.price === "string" ? item.price : ""} className="input" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-charcoal/50 mb-1">Prix fixe</label>
            <input name="priceNumeric" type="number" step="0.1" defaultValue={typeof item?.price === "number" ? item.price : ""} className="input" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-charcoal/50 mb-1">Prix / 100g</label>
            <input name="pricePer100g" type="number" step="0.1" defaultValue={field(item, "pricePer100g")} className="input" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-charcoal/50 mb-1">¼ Plateau</label>
            <input name="priceQuart" type="number" step="0.1" defaultValue={field(item, "priceQuart")} className="input" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-charcoal/50 mb-1">½ Plateau</label>
            <input name="priceDemi" type="number" step="0.1" defaultValue={field(item, "priceDemi")} className="input" />
          </div>
          <div>
            <label className="block text-[11px] text-brand-charcoal/50 mb-1">Plateau</label>
            <input name="pricePlateau" type="number" step="0.1" defaultValue={field(item, "pricePlateau")} className="input" />
          </div>
        </div>
      </fieldset>

      <div>
        <label className="block text-xs font-semibold text-brand-charcoal/60 mb-1.5">Tags (séparés par une virgule)</label>
        <input name="tags" defaultValue={item?.tags?.join(", ") ?? ""} placeholder="Épicé, Premium" className="input" />
      </div>

      <fieldset className="border border-brand-green/10 rounded-lg p-4">
        <legend className="text-xs font-semibold text-brand-charcoal/60 px-1">Visibilité</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={item?.isPublished ?? true}
            className="rounded border-brand-green/30"
          />
          Publié (visible sur le site) — décochez pour le masquer sans le supprimer
        </label>
      </fieldset>

      <fieldset className="border border-brand-green/10 rounded-lg p-4">
        <legend className="text-xs font-semibold text-brand-charcoal/60 px-1">Étiquettes</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-sm">
          {([
            ["isSignature", "Signature"],
            ["isVegetarian", "Végétarien"],
            ["isComingSoon", "Bientôt disponible"],
            ["isCustom", "Composition libre"],
            ["isNew", "Nouveau"],
            ["isBestseller", "Coup de cœur"],
            ["isDevPick", "Choix du Dev"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input type="checkbox" name={key} defaultChecked={!!item?.[key]} className="rounded border-brand-green/30" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 rounded-lg bg-brand-green text-brand-white font-semibold text-sm hover:bg-brand-green-light transition-colors disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : submitLabel}
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
