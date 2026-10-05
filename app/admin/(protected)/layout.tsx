import { requireSession } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { countPendingChanges } from "@/lib/data/changes";
import { logout } from "@/app/admin/login/actions";
import AdminNav, { type NavLink } from "./AdminNav";
import ActivityPing from "./ActivityPing";

const NAV_LINKS: NavLink[] = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/audience", label: "Audience" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/pricing", label: "Tarifs" },
  { href: "/admin/contact", label: "Contact" },
  { href: "/admin/hours", label: "Horaires" },
  { href: "/admin/reviews", label: "Avis Google" },
];

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const pendingCount = await countPendingChanges().catch(() => 0);
  // Everyone sees every page; what they may *do* there is checked per action.
  const links: NavLink[] = [
    ...NAV_LINKS,
    { href: "/admin/approvals", label: "Validations", badge: pendingCount },
    { href: "/admin/staff", label: "Équipe" },
    // The team activity history is for the owner's eyes only.
    ...(session.role === "owner" ? [{ href: "/admin/activity", label: "Historique" }] : []),
  ];

  return (
    <div className="min-h-screen">
      {/* Two rows: brand + account actions, then the page links on their own
          row (10 links don't fit next to the brand without wrapping). */}
      <header className="bg-brand-green sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-12 sm:h-14">
          <span className="font-serif font-bold text-brand-white text-lg flex-shrink-0">Pezzo Italiano</span>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-brand-white/10 text-brand-white/80 font-semibold uppercase tracking-wide">
              {ROLE_LABELS[session.role]}
            </span>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap text-brand-white/70 hover:text-brand-gold text-sm font-medium transition-colors"
            >
              <span className="hidden sm:inline">Voir le site</span>
              <span className="sm:hidden">Site</span> ↗
            </a>
            <form action={logout}>
              <button
                type="submit"
                className="whitespace-nowrap text-brand-white/70 hover:text-brand-gold text-sm font-medium transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
        <AdminNav links={links} />
      </header>
      {/* The owner's own page navigation is not recorded. */}
      {session.role !== "owner" && <ActivityPing />}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">{children}</main>
    </div>
  );
}
