"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOwner, requireSession, requireTeamManager } from "@/lib/auth/session";
import { assignableRoles, canManageUser, type Role } from "@/lib/auth/roles";
import { hashPassword } from "@/lib/auth/password";
import { sql } from "@/lib/db";
import { logActivity } from "@/lib/data/activity";

async function nameOf(id: string): Promise<string | null> {
  const rows = await sql`SELECT name FROM admin_users WHERE id = ${id}`;
  return (rows[0]?.name as string) ?? null;
}

// Team management. The rules (lib/auth/roles.ts) are enforced here, not just
// hidden in the UI: the owner manages everyone but themselves stays untouchable
// by others; administrators manage staff only; nobody can create a second owner.

export interface StaffFormState {
  error?: string;
  success?: boolean;
}

async function roleOf(id: string): Promise<Role | null> {
  const rows = await sql`SELECT role FROM admin_users WHERE id = ${id}`;
  return (rows[0]?.role as Role) ?? null;
}

const CreateStaffSchema = z.object({
  email: z.string().trim().min(1, "Identifiant requis").max(120),
  name: z.string().trim().min(1, "Nom requis").max(80),
  password: z.string().min(8, "8 caractères minimum").max(200),
  role: z.enum(["staff", "administrator"]),
});

export async function createStaffUser(
  _prevState: StaffFormState | undefined,
  formData: FormData
): Promise<StaffFormState> {
  const session = await requireTeamManager();
  const parsed = CreateStaffSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { email, name, password, role } = parsed.data;
  if (!assignableRoles(session.role).includes(role)) {
    return { error: "Vous ne pouvez pas créer un compte avec ce rôle." };
  }

  const existing = await sql`SELECT 1 FROM admin_users WHERE email = ${email}`;
  if (existing.length > 0) {
    return { error: "Cet identifiant existe déjà." };
  }

  const passwordHash = await hashPassword(password);
  await sql`
    INSERT INTO admin_users (email, password_hash, name, role)
    VALUES (${email}, ${passwordHash}, ${name}, ${role})
  `;
  await logActivity({ userId: session.userId, action: "staff_create", target: name, details: { role, login: email } });

  revalidatePath("/admin/staff");
  return { success: true };
}

/** Deactivate ("remove") or reactivate an account. Deactivation takes effect on their very next request. */
export async function toggleStaffActive(id: string, isActive: boolean): Promise<StaffFormState> {
  const session = await requireTeamManager();
  if (id === session.userId) return { error: "Vous ne pouvez pas désactiver votre propre compte." };
  const target = await roleOf(id);
  if (!target || !canManageUser(session.role, target)) return { error: "Action non autorisée sur ce compte." };
  await sql`UPDATE admin_users SET is_active = ${!isActive}, updated_at = now() WHERE id = ${id} AND role <> 'owner'`;
  await logActivity({ userId: session.userId, action: isActive ? "staff_deactivate" : "staff_reactivate", target: await nameOf(id) });
  revalidatePath("/admin/staff");
  return { success: true };
}

/** Owner only: switch an account between staff and administrator. */
export async function setStaffRole(id: string, role: Role): Promise<StaffFormState> {
  const session = await requireOwner();
  if (role !== "staff" && role !== "administrator") return { error: "Rôle invalide." };
  const target = await roleOf(id);
  if (!target || target === "owner") return { error: "Action non autorisée sur ce compte." };
  await sql`UPDATE admin_users SET role = ${role}, updated_at = now() WHERE id = ${id} AND role <> 'owner'`;
  await logActivity({ userId: session.userId, action: "staff_role", target: await nameOf(id), details: { from: target, to: role } });
  revalidatePath("/admin/staff");
  return { success: true };
}

const ResetPasswordSchema = z.object({
  password: z.string().min(8, "8 caractères minimum").max(200),
});

/** Anyone may change their own password; managers may reset the accounts they manage. */
export async function resetStaffPassword(
  id: string,
  _prevState: StaffFormState | undefined,
  formData: FormData
): Promise<StaffFormState> {
  const session = await requireSession();
  const target = await roleOf(id);
  if (!target) return { error: "Compte introuvable." };
  if (id !== session.userId && !canManageUser(session.role, target)) {
    return { error: "Action non autorisée sur ce compte." };
  }
  const parsed = ResetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide." };

  const passwordHash = await hashPassword(parsed.data.password);
  await sql`
    UPDATE admin_users
    SET password_hash = ${passwordHash}, failed_attempts = 0, locked_until = NULL, updated_at = now()
    WHERE id = ${id}
  `;
  await logActivity({ userId: session.userId, action: "staff_password", target: id === session.userId ? "Son propre mot de passe" : await nameOf(id) });
  return { success: true };
}
