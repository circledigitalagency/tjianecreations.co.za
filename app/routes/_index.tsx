import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import MarqueeBar from "~/components/_layout/marquee";

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { pool } from "~/db.server";
import { getGoogleReviews } from "~/reviews.server";
import GoogleReviews from "~/components/google/google-reviews";

export const meta: MetaFunction = () => [
	{ title: "Tjiane Creations — Handcrafted Leather Bags" },
	{
		name: "description",
		content:
			"Genuine leather bags handcrafted in Brakpan, South Africa. Shop the collection or order yours, fully personalised.",
	},
];

export async function loader() {
	const [featuredProducts] = (await pool.query(
		`SELECT
      p.id,
      p.slug,
      p.name,
      p.base_price,
      p.is_new,
      c.name AS category_name,
      lt.name AS leather_type,
      lt.is_vegan,
      (SELECT url FROM product_images pi
       WHERE pi.product_id = p.id
       ORDER BY pi.sort_order LIMIT 1) AS image_url
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN leather_types lt ON p.leather_type_id = lt.id
    WHERE p.is_active = 1
    ORDER BY p.is_new DESC, p.created_at DESC
    LIMIT 3`,
	)) as any;

	const reviewsData = await getGoogleReviews();

	return json({ featuredProducts, reviewsData });
}

export default function Index() {
	const { featuredProducts, reviewsData } = useLoaderData<typeof loader>();
	return (
		<MainLayout>
			{/* ── HERO ── */}
			<section className="min-h-[calc(100vh-80px)] grid md:grid-cols-2">
				{/* Left */}
				<div className="flex flex-col justify-center px-16 py-20 md:pl-16">
					<p className="text-eyebrow text-tan-dark mb-6">
						Handcrafted · Genuine Leather · Brakpan, South Africa
					</p>
					<h1 className="font-display font-light text-[clamp(3rem,5vw,5.5rem)] leading-[1.1] text-bark mb-6">
						Bags made
						<br />
						to{" "}
						<em className="italic text-accent not-italic font-light">carry</em>
						<br />
						your story.
					</h1>
					<p className="text-[0.95rem] leading-[1.8] text-bark-mid max-w-[400px] mb-12 font-light">
						Each bag is cut, stitched, and finished by hand — no two are ever
						the same. Choose from our ready-to-buy collection or order yours,
						fully personalised.
					</p>
					<div className="flex gap-4 flex-wrap items-center">
						<Link
							to="/shop"
							className="bg-accent text-cream-white px-9 py-[0.9rem] text-[0.8rem] tracking-[0.12em] uppercase no-underline transition-all duration-200 hover:bg-bark hover:-translate-y-px inline-block"
						>
							Browse the Shop
						</Link>
						<Link
							to="/custom"
							className="border border-bark-mid text-bark-mid px-9 py-[0.9rem] text-[0.8rem] tracking-[0.12em] uppercase no-underline transition-all duration-200 hover:bg-bark-mid hover:text-cream inline-block"
						>
							Customise Yours
						</Link>
					</div>
				</div>

				{/* Right — image placeholder */}
				<div className="relative overflow-hidden bg-tan-light min-h-[400px]">
					<div className="w-full h-full bg-tan-gradient flex flex-col items-center justify-center gap-4">
						<span className="text-[5rem] opacity-40">👜</span>
						<p className="font-display italic text-bark opacity-50">
							Your product photo here
						</p>
					</div>
					<div className="absolute bottom-10 left-10 bg-bark text-cream px-6 py-4 max-w-[200px] font-display italic leading-[1.5]">
						Genuine leather, handcrafted in South Africa
					</div>
				</div>
			</section>

			{/* ── MARQUEE ── */}
			<MarqueeBar />

			{/* ── FEATURED PRODUCTS TEASER ── */}
			<section className="px-16 py-24">
				<div className="flex items-end justify-between mb-12">
					<div>
						<span className="text-eyebrow text-tan-dark block mb-2">
							Ready to Buy
						</span>
						<h2 className="font-display font-light text-[clamp(2rem,3.5vw,3rem)] text-bark">
							The <em className="italic text-accent">Collection</em>
						</h2>
					</div>
					<Link
						to="/shop"
						className="text-nav text-bark-mid no-underline border-b border-bark-mid pb-0.5 transition-colors duration-200 hover:text-accent hover:border-accent"
					>
						View All Products
					</Link>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{(featuredProducts as any[]).map((product) => (
						<div
							key={product.id}
							className="bg-cream-white cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(44,31,20,0.12)]"
						>
							<div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-tan-light to-tan">
								{product.image_url ? (
									<img
										src={product.image_url}
										alt={product.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-[3rem] text-bark-mid opacity-30">
										👜
									</div>
								)}
								<div className="absolute top-4 left-4 flex flex-col gap-1">
									{product.is_new ? (
										<span className="bg-accent text-cream-white text-[0.65rem] tracking-[0.15em] uppercase px-3 py-1">
											New
										</span>
									) : null}
									{product.is_vegan ? (
										<span className="bg-bark text-cream text-[0.65rem] tracking-[0.15em] uppercase px-3 py-1">
											Vegan
										</span>
									) : null}
								</div>
							</div>

							<div className="p-5">
								<div className="font-display font-semibold text-[1.15rem] text-bark mb-1">
									{product.name}
								</div>
								<div className="text-[0.72rem] tracking-[0.12em] uppercase text-tan-dark mb-3">
									{product.category_name}
								</div>
								<div className="flex items-center justify-between">
									<span className="font-display font-semibold text-[1.2rem] text-bark">
										R {Number(product.base_price).toLocaleString("en-ZA")}
									</span>
									<Link
										to={`/shop/${product.slug}`}
										className="bg-bark text-cream py-2 px-4 text-[0.72rem] tracking-[0.1em] uppercase font-body transition-colors hover:bg-accent no-underline"
									>
										View
									</Link>
								</div>
							</div>
						</div>
					))}

					{(featuredProducts as any[]).length === 0 && (
						<div className="col-span-3 text-center py-12">
							<p className="font-display italic text-xl text-bark-mid">
								Products coming soon.
							</p>
						</div>
					)}
				</div>
			</section>

			{/* ── ABOUT STRIP ── */}
			<section className="px-16 py-20 grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-16 items-center bg-tan-light">
				<div className="text-center">
					<span className="font-display font-light text-[3.5rem] text-bark leading-none block mb-2">
						100%
					</span>
					<p className="text-[0.75rem] tracking-[0.15em] uppercase text-bark-mid">
						Genuine Leather
					</p>
				</div>
				<div className="text-center">
					<h3 className="font-display font-light italic text-[1.8rem] text-bark mb-4">
						"Made with patience, purpose, and pride."
					</h3>
					<p className="text-[0.9rem] leading-[1.9] text-bark-mid font-light">
						Tjiane Creations is a one-woman craft studio based in Brakpan, South
						Africa. Every bag is planned, cut, and stitched by hand — no
						shortcuts, no compromises.
					</p>
				</div>
				<div className="text-center">
					<span className="font-display font-light text-[3.5rem] text-bark leading-none block mb-2">
						0
					</span>
					<p className="text-[0.75rem] tracking-[0.15em] uppercase text-bark-mid">
						Mass production — ever
					</p>
				</div>
			</section>

			{reviewsData && (
				<GoogleReviews
					businessName={reviewsData.businessName}
					rating={reviewsData.rating}
					totalReviews={reviewsData.totalReviews}
					googleUrl={reviewsData.googleUrl}
					reviews={reviewsData.reviews}
				/>
			)}
		</MainLayout>
	);
}
