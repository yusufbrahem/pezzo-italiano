// Admin roles and what each may do — pure, so both server code and client
// components can import it. The server actions are the real gate; the UI only
// uses these to hide buttons that would be refused anyway.
//
//   owner          one account, can't be deactivated. Everything applies
//                  immediately, and only the owner approves others' menu /
//                  pricing changes (/admin/approvals).
//   administrator  same as staff, plus manages *staff* accounts (create,
//                  deactivate/reactivate, reset their password).
//   staff          sees the whole admin. Menu + pricing changes are submitted
//                  for the owner's approval; hours, contact, reviews refresh and
//                  order follow-up apply immediately.

export const ROLES = ["owner", "administrator", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Propriétaire",
  administrator: "Administrateur",
  staff: "Staff",
};

/** Menu & pricing changes by this role wait for the owner's approval. */
export const needsApproval = (role: Role) => role !== "owner";

/** Can open the team-management controls at all. */
export const canManageTeam = (role: Role) => role === "owner" || role === "administrator";

/** Roles this actor may give to a new account. Nobody can create another owner. */
export const assignableRoles = (role: Role): Role[] =>
  role === "owner" ? ["staff", "administrator"] : role === "administrator" ? ["staff"] : [];

/**
 * May `actor` deactivate/reactivate or reset the password of `target`?
 * The owner account is untouchable by others; administrators only manage staff.
 * (Anyone may change their own password — handled separately.)
 */
export function canManageUser(actor: Role, target: Role): boolean {
  if (target === "owner") return false;
  if (actor === "owner") return true;
  if (actor === "administrator") return target === "staff";
  return false;
}
