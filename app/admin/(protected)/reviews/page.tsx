import { getGoogleReviews } from "@/lib/google-places";
import { GOOGLE_REVIEW_URL } from "@/lib/order";
import { getOrderStats } from "@/lib/data/orders";
import RefreshButton from "./RefreshButton";

export const metadata = { title: "Avis Google" };

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-brand-gold tracking-tight" aria-label={`${rating} sur 5`}>
      {"★".repeat(Math.round(rating))}
      <span className="text-brand-charcoal/15">{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

export default async function AdminReviewsPage() {
  const [data, orderStats] = await Promise.all([getGoogleReviews(), getOrderStats().catch(() => null)]);

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="font-serif text-2xl font-bold text-brand-green">Avis Google</h1>

      <div className="bg-white rounded-xl border border-brand-green/10 p-5 sm:p-6">
        {data ? (
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-5xl font-semibold text-brand-charcoal">
                {data.rating.toFixed(1)} <span className="text-base font-normal text-brand-charcoal/40">/ 5</span>
              </p>
              <p className="text-sm text-brand-charcoal/50 mt-1">
                <Stars rating={data.rating} /> · {data.totalRatings} avis au total
              </p>
            </div>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-brand-green/20 text-sm font-semibold text-brand-green hover:border-brand-green/40 transition-colors"
            >
              Voir / répondre sur Google ↗
            </a>
          </div>
        ) : (
          <p className="text-sm text-brand-charcoal/50 mb-5">
            Impossible de récupérer les avis pour le moment (clé API manquante ou service indisponible).
          </p>
        )}

        <p className="text-xs text-brand-charcoal/45 mb-4">
          Les avis se rafraîchissent automatiquement toutes les 6 heures. Utilisez le bouton ci-dessous pour forcer une
          mise à jour immédiate (par exemple juste après avoir reçu un nouvel avis).
        </p>
        <RefreshButton />
      </div>

      {orderStats && orderStats.toFollowUp > 0 && (
        <a
          href="/admin/clients?status=to_follow_up"
          className="flex items-center justify-between gap-3 bg-brand-gold/10 border border-brand-gold/30 rounded-xl p-4 hover:border-brand-gold/60 transition-colors"
        >
          <span className="text-sm text-brand-charcoal">
            <span className="font-semibold">{orderStats.toFollowUp} client(s)</span> ont commandé et n&apos;ont pas
            encore été sollicités pour un avis.
          </span>
          <span className="text-sm font-semibold text-brand-green flex-shrink-0">Relancer →</span>
        </a>
      )}

      {data && data.reviews.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-green/10 p-5 sm:p-6">
          <h2 className="font-semibold text-brand-charcoal">Derniers avis affichés sur le site</h2>
          <p className="text-xs text-brand-charcoal/45 mt-0.5 mb-4">
            Google ne transmet que 5 avis récents ; seuls ceux de 4★ et plus sont affichés sur le site. Consultez tous
            les avis (et répondez-y) directement sur Google.
          </p>
          <ul className="divide-y divide-brand-green/5">
            {data.reviews.map((r, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-sm font-semibold text-brand-charcoal truncate">{r.authorName}</span>
                  <span className="text-xs text-brand-charcoal/40 flex-shrink-0">{r.relativeTime}</span>
                </div>
                <Stars rating={r.rating} />
                <p className="text-sm text-brand-charcoal/70 mt-1 line-clamp-4">{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
