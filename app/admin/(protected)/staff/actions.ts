"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { sql } from "@/lib/db";

export interface StaffFormState {
  error?: string;
}

const CreateStaffSchema = z.object({
  email: z.string().trim().min(1, "Identifiant requis"),
  name: z.string().trim().min(1, "Nom requis"),
  password: z.string().min(8, "8 caractères minimum"),
  role: z.enum(["owner", "staff"]),
});

export async function createStaffUser(
  _prevState: StaffFormState | undefined,
  formData: FormData
): Promise<StaffFormState> {
  await requireOwner();
  const parsed = CreateStaffSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { email, name, password, role } = parsed.data;

  const existing = await sql`SELECT 1 FROM admin_users WHERE email = ${email}`;
  if (existing.length > 0) {
    return { error: "Cet identifiant existe déjà." };
  }

  const passwordHash = await hashPassword(password);
  await sql`
    INSERT INTO admin_users (email, password_hash, name, role)
    VALUES (${email}, ${passwordHash}, ${name}, ${role})
  `;

  revalidatePath("/admin/staff");
  return {};
}

export async function toggleStaffActive(id: string, isActive: boolean) {
  const session = await requireOwner();
  if (id === session.userId) return; // can't deactivate yourself
  await sql`UPDATE admin_users SET is_active = ${!isActive} WHERE id = ${id}`;
  revalidatePath("/admin/staff");
}

const ResetPasswordSchema = z.object({
  password: z.string().min(8, "8 caractères minimum"),
});

export async function resetStaffPassword(
  id: string,
  _prevState: StaffFormState | undefined,
  formData: FormData
): Promise<StaffFormState> {
  await requireOwner();
  const parsed = ResetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide." };

  const passwordHash = await hashPassword(parsed.data.password);
  await sql`
    UPDATE admin_users
    SET password_hash = ${passwordHash}, failed_attempts = 0, locked_until = NULL
    WHERE id = ${id}
  `;
  return {};
}
