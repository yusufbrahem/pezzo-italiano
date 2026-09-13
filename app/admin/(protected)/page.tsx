import Link from "next/link";
import { sql } from "@/lib/db";
import { getHoursOverride, getHoursSchedule } from "@/lib/data/settings";
import { computeIsOpen } from "@/lib/hours-shared";
import { getGoogleReviews } from "@/lib/google-places";

export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboard() {
  const [countRows, schedule, override, reviews] = await Promise.all([
    sql`SELECT count(*) FROM menu_items`,
    getHoursSchedule(),
    getHoursOverride(),
    getGoogleReviews(),
  ]);

  const itemCount = Number(countRows[0].count);
  const status = computeIsOpen(schedule, override);

  const cards = [
    { label: "Articles au menu", value: itemCount, href: "/admin/menu" },
    {
      label: "Statut actuel",
      value: status.open ? "Ouvert" : "Fermé",
      hint: status.source === "override" ? "Dérogation active" : "Horaires normaux",
      href: "/admin/hours",
    },
    {
      label: "Avis Google",
      value: reviews ? `${reviews.rating.toFixed(1)} ★` : "—",
      hint: reviews ? `${reviews.totalRatings} avis` : "Indisponible",
      href: "/admin/reviews",
    },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-6">Tableau de bord</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="block bg-white rounded-xl border border-brand-green/10 p-5 hover:border-brand-gold/40 transition-colors"
          >
            <p className="text-xs text-brand-charcoal/50 uppercase tracking-wide mb-1">{card.label}</p>
            <p className="font-serif text-2xl font-bold text-brand-green">{card.value}</p>
            {card.hint && <p className="text-xs text-brand-charcoal/40 mt-1">{card.hint}</p>}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-brand-green/10 p-5">
        <h2 className="font-semibold text-brand-charcoal mb-3">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/menu/new" className="px-4 py-2 rounded-lg bg-brand-gold text-brand-green text-sm font-semibold hover:bg-brand-gold-light transition-colors">
            + Ajouter un article
          </Link>
          <Link href="/admin/hours" className="px-4 py-2 rounded-lg border border-brand-green/15 text-brand-charcoal text-sm font-medium hover:border-brand-gold/40 transition-colors">
            Gérer les horaires
          </Link>
          <Link href="/admin/contact" className="px-4 py-2 rounded-lg border border-brand-green/15 text-brand-charcoal text-sm font-medium hover:border-brand-gold/40 transition-colors">
            Modifier les coordonnées
          </Link>
        </div>
      </div>
    </div>
  );
}
