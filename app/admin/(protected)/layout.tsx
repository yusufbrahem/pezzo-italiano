import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { logout } from "@/app/admin/login/actions";

const NAV_LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/contact", label: "Contact" },
  { href: "/admin/hours", label: "Horaires" },
  { href: "/admin/reviews", label: "Avis Google" },
];

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen">
      <header className="bg-brand-green">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="font-serif font-bold text-brand-white text-lg">Pezzo Italiano</span>
            <nav className="hidden md:flex items-center gap-5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-brand-white/70 hover:text-brand-gold text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {session.role === "owner" && (
                <Link
                  href="/admin/staff"
                  className="text-brand-white/70 hover:text-brand-gold text-sm font-medium transition-colors"
                >
                  Équipe
                </Link>
              )}
            </nav>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-brand-white/60 hover:text-brand-gold text-sm font-medium transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-4 overflow-x-auto px-4 pb-3 -mt-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-brand-white/70 hover:text-brand-gold text-xs font-medium whitespace-nowrap transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {session.role === "owner" && (
            <Link href="/admin/staff" className="text-brand-white/70 hover:text-brand-gold text-xs font-medium whitespace-nowrap transition-colors">
              Équipe
            </Link>
          )}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
