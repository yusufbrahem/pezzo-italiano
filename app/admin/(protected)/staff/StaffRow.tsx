"use client";

import { useTransition, useActionState } from "react";
import { toggleStaffActive, resetStaffPassword, type StaffFormState } from "./actions";

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "staff";
  isActive: boolean;
  lastLoginAt: string | null;
}

export default function StaffRow({ user, isSelf }: { user: StaffUser; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const boundReset = resetStaffPassword.bind(null, user.id);
  const [resetState, resetAction, resetPending] = useActionState<StaffFormState | undefined, FormData>(
    boundReset,
    undefined
  );

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-brand-charcoal text-sm">{user.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-semibold uppercase">
              {user.role === "owner" ? "Propriétaire" : "Staff"}
            </span>
            {!user.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold uppercase">
                Désactivé
              </span>
            )}
          </div>
          <p className="text-xs text-brand-charcoal/45">{user.email}</p>
        </div>
        {!isSelf && user.role !== "owner" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => toggleStaffActive(user.id, user.isActive))}
            className="text-xs font-semibold text-brand-charcoal/60 hover:text-brand-green px-2 py-1 flex-shrink-0"
          >
            {user.isActive ? "Désactiver" : "Réactiver"}
          </button>
        )}
      </div>

      <details className="mt-2">
        <summary className="text-xs text-brand-charcoal/45 cursor-pointer hover:text-brand-green">
          Réinitialiser le mot de passe
        </summary>
        <form action={resetAction} className="flex items-center gap-2 mt-2">
          <input
            type="password"
            name="password"
            placeholder="Nouveau mot de passe (8 caractères min.)"
            required
            minLength={8}
            className="flex-1 px-3 py-1.5 rounded-lg border border-brand-green/15 text-sm"
          />
          <button
            type="submit"
            disabled={resetPending}
            className="px-3 py-1.5 rounded-lg bg-brand-green text-brand-white text-xs font-semibold hover:bg-brand-green-light transition-colors disabled:opacity-60"
          >
            {resetPending ? "..." : "Valider"}
          </button>
        </form>
        {resetState?.error && <p className="text-xs text-red-600 mt-1">{resetState.error}</p>}
        {resetState && !resetState.error && !resetPending && (
          <p className="text-xs text-green-700 mt-1">Mot de passe mis à jour.</p>
        )}
      </details>
    </div>
  );
}
