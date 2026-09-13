import { getGoogleReviews } from "@/lib/google-places";
import RefreshButton from "./RefreshButton";

export const metadata = { title: "Avis Google" };

export default async function AdminReviewsPage() {
  const data = await getGoogleReviews();

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-6">Avis Google</h1>

      <div className="bg-white rounded-xl border border-brand-green/10 p-6">
        {data ? (
          <>
            <p className="font-serif text-4xl font-black text-brand-gold mb-1">
              {data.rating.toFixed(1)} <span className="text-base font-normal text-brand-charcoal/40">/ 5</span>
            </p>
            <p className="text-sm text-brand-charcoal/50 mb-6">{data.totalRatings} avis au total</p>
          </>
        ) : (
          <p className="text-sm text-brand-charcoal/50 mb-6">
            Impossible de récupérer les avis pour le moment (clé API manquante ou service indisponible).
          </p>
        )}

        <p className="text-xs text-brand-charcoal/45 mb-4">
          Les avis se rafraîchissent automatiquement toutes les 6 heures. Utilisez le bouton ci-dessous pour forcer
          une mise à jour immédiate (par exemple juste après avoir répondu à un nouvel avis).
        </p>
        <RefreshButton />
      </div>
    </div>
  );
}
