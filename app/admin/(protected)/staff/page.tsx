import { requireOwner } from "@/lib/auth/session";
import { sql } from "@/lib/db";
import CreateStaffForm from "./CreateStaffForm";
import StaffRow from "./StaffRow";

export const metadata = { title: "Équipe" };

export default async function AdminStaffPage() {
  const session = await requireOwner();
  const staff = await sql`
    SELECT id, email, name, role, is_active, last_login_at
    FROM admin_users ORDER BY created_at ASC
  `;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-6">Équipe</h1>

      <div className="bg-white rounded-xl border border-brand-green/10 divide-y divide-brand-green/8 mb-8">
        {staff.map((user) => (
          <StaffRow
            key={user.id}
            user={{
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              isActive: user.is_active,
              lastLoginAt: user.last_login_at,
            }}
            isSelf={user.id === session.userId}
          />
        ))}
      </div>

      <h2 className="font-semibold text-brand-charcoal mb-3">Ajouter un membre</h2>
      <CreateStaffForm />
    </div>
  );
}
