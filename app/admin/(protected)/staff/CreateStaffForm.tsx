"use client";

import { useActionState } from "react";
import { createStaffUser, type StaffFormState } from "./actions";

const initialState: StaffFormState = {};

export default function CreateStaffForm() {
  const [state, formAction, pending] = useActionState(createStaffUser, initialState);

  return (
    <form action={formAction} className="bg-white rounded-xl border border-brand-green/10 p-6 space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Identifiant (nom d&apos;utilisateur ou email)</label>
          <input name="email" required className="input" />
        </div>
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Nom</label>
          <input name="name" required className="input" />
        </div>
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Mot de passe temporaire</label>
          <input name="password" type="text" required minLength={8} className="input" />
        </div>
        <div>
          <label className="block text-[11px] text-brand-charcoal/50 mb-1">Rôle</label>
          <select name="role" defaultValue="staff" className="input">
            <option value="staff">Staff</option>
            <option value="owner">Propriétaire</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 rounded-lg bg-brand-gold text-brand-green font-semibold text-sm hover:bg-brand-gold-light transition-colors disabled:opacity-60"
      >
        {pending ? "Création..." : "Créer le compte"}
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
