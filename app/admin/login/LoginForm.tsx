"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="bg-white rounded-2xl shadow-sm border border-brand-green/10 p-6 space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-brand-charcoal/60 mb-1.5">
          Identifiant
        </label>
        <input
          id="email"
          name="email"
          type="text"
          autoComplete="username"
          required
          className="w-full px-3.5 py-2.5 rounded-lg border border-brand-green/15 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-brand-charcoal/60 mb-1.5">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-3.5 py-2.5 rounded-lg border border-brand-green/15 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg bg-brand-green text-brand-white font-semibold text-sm hover:bg-brand-green-light transition-colors disabled:opacity-60"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
