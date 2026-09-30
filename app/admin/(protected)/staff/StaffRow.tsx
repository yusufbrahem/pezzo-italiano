"use client";

import { useState, useTransition, useActionState } from "react";
import { ROLE_LABELS, type Role } from "@/lib/auth/roles";
import { toggleStaffActive, resetStaffPassword, setStaffRole, type StaffFormState } from "./actions";

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | Date | null;
}

const loginFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Tunis",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Controls are shown according to what the viewer may do (computed on the
// server from lib/auth/roles.ts); the actions re-check it anyway.
export default function StaffRow({
  user,
  isSelf,
  canManage,
  canResetPassword,
  canChangeRole,
}: {
  user: StaffUser;
  isSelf: boolean;
  canManage: boolean; // deactivate / reactivate
  canResetPassword: boolean;
  canChangeRole: boolean; // owner only: staff <-> administrator
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const boundReset = resetStaffPassword.bind(null, user.id);
  const [resetState, resetAction, resetPending] = useActionState<StaffFormState | undefined, FormData>(
    boundReset,
    undefined
  );

  const run = (fn: () => Promise<StaffFormState>) =>
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if (r.error) setError(r.error);
    });

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-brand-charcoal text-sm">{user.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-semibold uppercase">
              {ROLE_LABELS[user.role]}
            </span>
            {isSelf && <span className="text-[10px] text-brand-charcoal/60">(vous)</span>}
            {!user.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold uppercase">
                Désactivé
              </span>
            )}
          </div>
          <p className="text-xs text-brand-charcoal/60 truncate">{user.email}</p>
          <p className="text-[11px] text-brand-charcoal/60 mt-0.5">
            {user.lastLoginAt ? `Dernière connexion : ${loginFmt.format(new Date(user.lastLoginAt))}` : "Jamais connecté"}
          </p>
        </div>
        {canChangeRole && (
          <select
            aria-label={`Rôle de ${user.name}`}
            value={user.role}
            disabled={pending}
            onChange={(e) => run(() => setStaffRole(user.id, e.target.value as Role))}
            className="text-xs border border-brand-green/15 rounded-md px-1.5 py-1 flex-shrink-0"
          >
            <option value="staff">{ROLE_LABELS.staff}</option>
            <option value="administrator">{ROLE_LABELS.administrator}</option>
          </select>
        )}
        {canManage && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!user.isActive || confirm(`Désactiver le compte de ${user.name} ? Il ne pourra plus se connecter.`)) {
                run(() => toggleStaffActive(user.id, user.isActive));
              }
            }}
            className={`text-xs font-semibold px-2 py-1 flex-shrink-0 ${
              user.isActive ? "text-red-700 hover:text-red-800" : "text-brand-green hover:text-brand-gold-deep"
            }`}
          >
            {user.isActive ? "Désactiver" : "Réactiver"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}

      {canResetPassword && (
        <details className="mt-2">
          <summary className="text-xs text-brand-charcoal/60 cursor-pointer hover:text-brand-green">
            {isSelf ? "Changer mon mot de passe" : "Réinitialiser le mot de passe"}
          </summary>
          <form action={resetAction} className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
            <input
              type="password"
              name="password"
              placeholder="Nouveau mot de passe (8 caractères min.)"
              required
              minLength={8}
              autoComplete="new-password"
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-brand-green/15 text-sm"
            />
            <button
              type="submit"
              disabled={resetPending}
              className="px-4 py-2 rounded-lg bg-brand-green text-brand-white text-xs font-semibold hover:bg-brand-green-light transition-colors disabled:opacity-60"
            >
              {resetPending ? "..." : "Valider"}
            </button>
          </form>
          {resetState?.error && <p className="text-xs text-red-700 mt-1">{resetState.error}</p>}
          {resetState?.success && !resetPending && <p className="text-xs text-green-700 mt-1">Mot de passe mis à jour.</p>}
        </details>
      )}
    </div>
  );
}
