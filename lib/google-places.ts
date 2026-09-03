export interface PlaceReview {
  authorName: string;
  authorPhoto: string;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface PlaceData {
  rating: number;
  totalRatings: number;
  reviews: PlaceReview[];
}

export async function getGoogleReviews(): Promise<PlaceData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY is not set");
    return null;
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.rating,places.userRatingCount,places.reviews",
      },
      body: JSON.stringify({
        textQuery: "Pezzo Italiano Sousse",
        languageCode: "fr",
      }),
      // Cache for 6 hours — ~4 API calls/day, and a transient API
      // failure clears within 6h instead of being stuck for a full day
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      console.error("Google Places API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews: PlaceReview[] = (place.reviews ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r.rating >= 4 && r.text?.text)
      // Google returns its "most relevant" 5 in no set order — show newest first.
      // publishTime is ISO 8601, so lexical sort == chronological sort.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => (b.publishTime ?? "").localeCompare(a.publishTime ?? ""))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({
        authorName: r.authorAttribution?.displayName ?? "Client Google",
        authorPhoto: r.authorAttribution?.photoUri ?? "",
        rating: r.rating as number,
        text: r.text?.text ?? "",
        relativeTime: r.relativePublishTimeDescription ?? "",
      }));

    return {
      rating: place.rating ?? 0,
      totalRatings: place.userRatingCount ?? 0,
      reviews,
    };
  } catch (err) {
    console.error("Failed to fetch Google reviews:", err);
    return null;
  }
}
