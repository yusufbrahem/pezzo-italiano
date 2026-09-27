import { requireSession } from "@/lib/auth/session";
import { logout } from "@/app/admin/login/actions";
import AdminNav, { type NavLink } from "./AdminNav";

const NAV_LINKS: NavLink[] = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/pricing", label: "Tarifs" },
  { href: "/admin/contact", label: "Contact" },
  { href: "/admin/hours", label: "Horaires" },
  { href: "/admin/reviews", label: "Avis Google" },
];

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const links = session.role === "owner" ? [...NAV_LINKS, { href: "/admin/staff", label: "Équipe" }] : NAV_LINKS;

  return (
    <div className="min-h-screen">
      <header className="bg-brand-green sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-14 lg:h-16">
          <div className="flex items-center gap-6 min-w-0">
            <span className="font-serif font-bold text-brand-white text-lg flex-shrink-0">Pezzo Italiano</span>
            <AdminNav links={links} variant="desktop" />
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-white/60 hover:text-brand-gold text-sm font-medium transition-colors"
            >
              <span className="hidden sm:inline">Voir le site</span>
              <span className="sm:hidden">Site</span> ↗
            </a>
            <form action={logout}>
              <button
                type="submit"
                className="text-brand-white/60 hover:text-brand-gold text-sm font-medium transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
        <AdminNav links={links} variant="mobile" />
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">{children}</main>
    </div>
  );
}
