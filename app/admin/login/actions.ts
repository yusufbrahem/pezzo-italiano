"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie, clearSessionCookie } from "@/lib/auth/session";

const LoginSchema = z.object({
  email: z.string().trim().min(1, "Identifiant requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export interface LoginState {
  error?: string;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Identifiant et mot de passe requis." };
  }
  const { email, password } = parsed.data;

  const rows = await sql`
    SELECT id, password_hash, is_active, failed_attempts, locked_until
    FROM admin_users WHERE email = ${email}
  `;
  const user = rows[0];

  // Generic error whether the account doesn't exist or the password is wrong
  // — never reveal which one, so an attacker can't enumerate valid logins.
  const genericError = "Identifiant ou mot de passe incorrect.";

  if (!user) return { error: genericError };

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return { error: `Compte temporairement verrouillé. Réessayez dans ${LOCKOUT_MINUTES} minutes.` };
  }

  if (!user.is_active) return { error: genericError };

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    const attempts = (user.failed_attempts ?? 0) + 1;
    const lockUntil = attempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
      : null;
    await sql`
      UPDATE admin_users SET failed_attempts = ${attempts}, locked_until = ${lockUntil}
      WHERE id = ${user.id}
    `;
    return attempts >= MAX_ATTEMPTS
      ? { error: `Trop de tentatives. Compte verrouillé ${LOCKOUT_MINUTES} minutes.` }
      : { error: genericError };
  }

  await sql`
    UPDATE admin_users
    SET failed_attempts = 0, locked_until = NULL, last_login_at = now()
    WHERE id = ${user.id}
  `;

  const userRows = await sql`SELECT role FROM admin_users WHERE id = ${user.id}`;
  await createSessionCookie({ userId: user.id, role: userRows[0].role });
  redirect("/admin");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/admin/login");
}
