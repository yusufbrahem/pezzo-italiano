import { requireSession } from "@/lib/auth/session";
import { assignableRoles, canManageTeam, canManageUser, ROLE_LABELS, type Role } from "@/lib/auth/roles";
import { sql } from "@/lib/db";
import CreateStaffForm from "./CreateStaffForm";
import StaffRow from "./StaffRow";

export const metadata = { title: "Équipe" };

const ROLE_ORDER: Record<Role, number> = { owner: 0, administrator: 1, staff: 2 };

export default async function AdminStaffPage() {
  const session = await requireSession();
  const rows = await sql`
    SELECT id, email, name, role, is_active, last_login_at
    FROM admin_users ORDER BY created_at ASC
  `;
  const staff = [...rows].sort((a, b) => ROLE_ORDER[a.role as Role] - ROLE_ORDER[b.role as Role]);
  const roles = assignableRoles(session.role);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-2">Équipe</h1>
      <div className="text-xs text-brand-charcoal/60 mb-6 space-y-1">
        <p>
          <strong>{ROLE_LABELS.owner}</strong> — tous les droits ; seul à valider les modifications du menu et des tarifs.
          Ce compte ne peut pas être désactivé.
        </p>
        <p>
          <strong>{ROLE_LABELS.administrator}</strong> — comme le staff, et peut ajouter ou désactiver des comptes staff.
        </p>
        <p>
          <strong>{ROLE_LABELS.staff}</strong> — voit tout ; ses modifications du menu et des tarifs attendent la validation
          du propriétaire. Horaires et contact : modifiables directement.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-brand-green/10 divide-y divide-brand-green/8 mb-8">
        {staff.map((user) => {
          const role = user.role as Role;
          const isSelf = user.id === session.userId;
          return (
            <StaffRow
              key={user.id}
              user={{
                id: user.id,
                email: user.email,
                name: user.name,
                role,
                isActive: user.is_active,
                lastLoginAt: user.last_login_at,
              }}
              isSelf={isSelf}
              canManage={!isSelf && canManageUser(session.role, role)}
              canResetPassword={isSelf || canManageUser(session.role, role)}
              canChangeRole={session.role === "owner" && role !== "owner"}
            />
          );
        })}
      </div>

      {canManageTeam(session.role) && (
        <>
          <h2 className="font-semibold text-brand-charcoal mb-3">Ajouter un membre</h2>
          <CreateStaffForm roles={roles} />
        </>
      )}
    </div>
  );
}
