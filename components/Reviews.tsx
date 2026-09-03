import { getGoogleReviews } from "@/lib/google-places";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={star <= rating ? "#c9a84c" : "none"}
          stroke="#c9a84c"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Google">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function InitialAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    "bg-brand-green text-brand-white",
    "bg-brand-gold text-brand-green",
    "bg-brand-charcoal text-brand-white",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-base flex-shrink-0 ${color}`}>
      {initial}
    </div>
  );
}

export default async function Reviews() {
  const data = await getGoogleReviews();
  const hasReviews = !!data && data.reviews.length > 0;

  return (
    <section id="avis" className="bg-brand-green py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block text-brand-gold text-xs font-bold uppercase tracking-[0.25em] mb-4">
            Ce que disent nos clients
          </span>
          <h2
            className="font-serif text-4xl sm:text-5xl font-bold text-brand-white mb-6"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Avis Google
          </h2>

          {/* Overall rating */}
          {hasReviews && (
          <div className="inline-flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <span
                className="font-serif text-6xl font-black text-brand-gold"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                {data.rating.toFixed(1)}
              </span>
              <div className="flex flex-col items-start gap-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} width="20" height="20" viewBox="0 0 24 24"
                      fill={star <= Math.round(data.rating) ? "#c9a84c" : "none"}
                      stroke="#c9a84c" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <span className="text-brand-white/50 text-sm">
                  {data.totalRatings.toLocaleString("fr-FR")} avis
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-brand-white/40 text-xs">
              <GoogleIcon />
              <span>Avis vérifiés Google</span>
            </div>
          </div>
          )}

          {!hasReviews && (
            <p className="text-brand-white/50 text-base max-w-md mx-auto">
              Rejoignez nos clients satisfaits et découvrez leurs avis
              directement sur Google.
            </p>
          )}
        </div>

        {/* Review cards */}
        {hasReviews && data && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.reviews.map((review, i) => (
            <div
              key={i}
              className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/12 hover:border-brand-gold/30 transition-all duration-300"
            >
              {/* Author row */}
              <div className="flex items-center gap-3 mb-4">
                {review.authorPhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={review.authorPhoto}
                    alt={review.authorName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <InitialAvatar name={review.authorName} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-brand-white font-semibold text-sm truncate">
                    {review.authorName}
                  </p>
                  <p className="text-brand-white/40 text-xs">{review.relativeTime}</p>
                </div>
                <GoogleIcon />
              </div>

              {/* Stars */}
              <div className="mb-3">
                <StarRating rating={review.rating} />
              </div>

              {/* Text */}
              <p className="text-brand-white/70 text-sm leading-relaxed line-clamp-4">
                {review.text}
              </p>
            </div>
          ))}
        </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="https://www.google.com/maps/place/Pezzo+Italiano+Sousse/@35.8458983,10.6012652,141m"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-brand-white/20 text-brand-white/70 hover:border-brand-gold hover:text-brand-gold text-sm font-semibold transition-all duration-300"
          >
            <GoogleIcon />
            Voir tous les avis sur Google
          </a>
        </div>
      </div>
    </section>
  );
}
