import { Star } from "lucide-react";

interface Review {
	author_name: string;
	profile_photo_url?: string;
	rating: number;
	relative_time_description: string;
	text: string;
}

interface GoogleReviewsProps {
	businessName: string;
	rating: number;
	totalReviews: number;
	googleUrl?: string;
	reviews: Review[];
}

function StarRow({ rating }: { rating: number }) {
	return (
		<div className="flex gap-0.5">
			{[1, 2, 3, 4, 5].map((i) => (
				<Star
					key={i}
					size={14}
					className={
						i <= rating ? "text-tan fill-tan" : "text-tan/20 fill-tan/20"
					}
				/>
			))}
		</div>
	);
}

export default function GoogleReviews({
	businessName,
	rating,
	totalReviews,
	googleUrl,
	reviews,
}: GoogleReviewsProps) {
	if (reviews.length === 0) return null;

	return (
		<section className="px-16 py-20 bg-cream-white border-t border-tan/20">
			<div className="flex items-end justify-between mb-10">
				<div>
					<span className="text-eyebrow text-tan-dark block mb-2">
						Customer Reviews
					</span>
					<h2 className="font-display font-light text-[clamp(2rem,3.5vw,3rem)] text-bark">
						What people are <em className="italic text-accent">saying</em>
					</h2>
				</div>

				<div className="text-right">
					<div className="flex items-center gap-2 justify-end mb-1">
						<span className="font-display text-2xl font-semibold text-bark">
							{rating?.toFixed(1)}
						</span>
						<StarRow rating={Math.round(rating)} />
					</div>
					<p className="text-[0.78rem] text-bark-mid">
						Based on {totalReviews} Google reviews
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{reviews.slice(0, 5).map((review, i) => (
					<div
						key={i}
						className="bg-cream border border-tan/20 p-6 flex flex-col"
					>
						<StarRow rating={review.rating} />
						<p className="text-[0.85rem] text-bark-mid leading-relaxed font-light mt-4 mb-5 flex-1">
							"
							{review.text.length > 180
								? review.text.slice(0, 180) + "…"
								: review.text}
							"
						</p>
						<div className="flex items-center gap-3">
							{review.profile_photo_url ? (
								<img
									src={review.profile_photo_url}
									alt={review.author_name}
									className="w-9 h-9 rounded-full"
									referrerPolicy="no-referrer"
								/>
							) : (
								<div className="w-9 h-9 rounded-full bg-tan-light flex items-center justify-center text-bark font-medium text-sm">
									{review.author_name.charAt(0)}
								</div>
							)}
							<div>
								<p className="text-[0.82rem] font-medium text-bark">
									{review.author_name}
								</p>
								<p className="text-[0.72rem] text-bark-mid">
									{review.relative_time_description}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>

			{googleUrl && (
				<div className="text-center mt-10">
					<a
						href={googleUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-[0.78rem] tracking-[0.1em] uppercase text-accent border-b border-accent pb-0.5 no-underline hover:text-bark hover:border-bark transition-colors"
					>
						Read all reviews on Google →
					</a>
				</div>
			)}
		</section>
	);
}
