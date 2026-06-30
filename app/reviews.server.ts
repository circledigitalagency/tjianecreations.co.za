// app/reviews.server.ts
let cachedReviews: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours

export async function getGoogleReviews() {
	const now = Date.now();
	if (cachedReviews && now - cacheTimestamp < CACHE_DURATION) {
		return cachedReviews;
	}

	const placeId = process.env.GOOGLE_PLACE_ID;
	const apiKey = process.env.GOOGLE_PLACES_API_KEY;

	const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,url&key=${apiKey}`;

	const res = await fetch(url);
	const data = await res.json();

	if (data.status !== "OK" || !data.result) {
		console.error("Google Places error:", data.error_message);
		return cachedReviews; // fall back to stale cache rather than nothing
	}

	cachedReviews = {
		businessName: data.result.name,
		rating: data.result.rating,
		totalReviews: data.result.user_ratings_total,
		googleUrl: data.result.url,
		reviews: data.result.reviews ?? [],
	};
	cacheTimestamp = now;

	return cachedReviews;
}
