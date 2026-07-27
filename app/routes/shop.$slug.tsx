import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import * as React from "react";
import { Share2, Check, ArrowLeft, SparkleIcon, Download } from "lucide-react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
	const { slug } = params;

	const [[product]] = (await pool.query(
		`SELECT
      p.id, p.slug, p.name, p.base_price, p.description, p.colours, p.sizes,
      p.care_instructions, p.is_new, p.is_customisable,
      c.name  AS category_name,
      lt.name AS leather_type,
      lt.is_vegan
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN leather_types lt ON p.leather_type_id = lt.id
    WHERE p.slug = ? AND p.is_active = 1`,
		[slug],
	)) as any;

	if (!product) throw new Response("Not Found", { status: 404 });

	const [images] = (await pool.query(
		`SELECT url, alt_text FROM product_images
     WHERE product_id = ? ORDER BY sort_order`,
		[product.id],
	)) as any;

	const appUrl = process.env.APP_URL ?? "http://localhost:5173";

	return json({ product, images, appUrl });
}

// Open Graph meta tags — these control how the product looks when shared
export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) return [];
	const { product, images, appUrl } = data;
	const image = (images as any[])[0]?.url;
	const url = `${appUrl}/shop/${product.slug}`;

	return [
		{ title: `${product.name} — Tjiane Creations` },
		{
			name: "description",
			content:
				product.description ??
				`Handcrafted leather bag by Tjiane Creations. R ${Number(
					product.base_price,
				).toLocaleString("en-ZA")}`,
		},

		// Open Graph (Facebook, WhatsApp, LinkedIn)
		{ property: "og:title", content: product.name },
		{
			property: "og:description",
			content:
				product.description ??
				`R ${Number(product.base_price).toLocaleString(
					"en-ZA",
				)} · Handcrafted leather`,
		},
		{
			property: "og:image",
			content: image ? `${appUrl}${image}` : "",
		},
		{ property: "og:url", content: url },
		{ property: "og:type", content: "product" },

		// Twitter/X card
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: product.name },
		{
			name: "twitter:description",
			content: `R ${Number(product.base_price).toLocaleString(
				"en-ZA",
			)} · Tjiane Creations`,
		},
		{
			name: "twitter:image",
			content: image ? `${appUrl}${image}` : "",
		},
	];
};

export default function ProductDetail() {
	const { product, images } = useLoaderData<typeof loader>();
	const [selectedColour, setSelectedColour] = React.useState<string | null>(
		null,
	);
	const [activeImage, setActiveImage] = React.useState(0);
	const [copied, setCopied] = React.useState(false);
	const [selectedSize, setSelectedSize] = React.useState<string | null>(null);

	const navigate = useNavigate();

	// Parse "Mustard, Blue" -> ["Mustard", "Blue"]
	const colourOptions: string[] = (product.colours ?? "")
		.split(",")
		.map((c: string) => c.trim())
		.filter(Boolean);

	// If the product has colour options, one must be picked before add-to-cart
	const colourRequired = colourOptions.length > 0;

	const sizeOptions: string[] = (product.sizes ?? "")
		.split(",")
		.map((s: string) => s.trim())
		.filter(Boolean);

	const sizeRequired = sizeOptions.length > 0;

	const canAddToCart =
		(!colourRequired || selectedColour !== null) &&
		(!sizeRequired || selectedSize !== null);

	// Keyboard navigation between images
	React.useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "ArrowRight") {
				setActiveImage((prev) =>
					Math.min(prev + 1, (images as any[]).length - 1),
				);
			}
			if (e.key === "ArrowLeft") {
				setActiveImage((prev) => Math.max(prev - 1, 0));
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [images]);

	async function handleShare() {
		const shareData = {
			title: product.name,
			text: `Check out ${product.name} on Tjiane Creations — R ${Number(
				product.base_price,
			).toLocaleString("en-ZA")}`,
			url: window.location.href,
		};

		// Use native share sheet if available (mobile)
		if (navigator.share) {
			try {
				await navigator.share(shareData);
			} catch (e) {
				// User cancelled — do nothing
			}
		} else {
			// Fallback — copy link to clipboard
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		}
	}

	return (
		<MainLayout>
			<div className="px-8 md:px-16 py-16 max-w-6xl mx-auto">
				<button
					onClick={() => navigate(-1)}
					className="inline-flex items-center gap-2 text-[0.78rem] tracking-[0.1em] uppercase text-bark-mid hover:text-accent transition-colors cursor-pointer bg-transparent border-0 p-0 mb-8"
				>
					<ArrowLeft size={15} />
					Back
				</button>
				<div className="grid md:grid-cols-2 gap-16">
					{/* Images */}
					<div>
						{/* Main image */}
						<div className="aspect-[4/5] bg-gradient-to-br from-tan-light to-tan overflow-hidden mb-3">
							{(images as any[]).length > 0 ? (
								<img
									src={(images as any[])[activeImage]?.url}
									alt={(images as any[])[activeImage]?.alt_text ?? product.name}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center text-[5rem] opacity-20">
									👜
								</div>
							)}
						</div>

						{/* Thumbnails */}
						{(images as any[]).length > 1 && (
							<div className="flex gap-2 flex-wrap">
								{(images as any[]).map((img, i) => (
									<button
										key={i}
										onClick={() => setActiveImage(i)}
										className={`w-16 h-16 overflow-hidden border-2 transition-colors cursor-pointer ${
											activeImage === i ? "border-accent" : "border-transparent"
										}`}
									>
										<img
											src={img.url}
											alt={img.alt_text}
											className="w-full h-full object-cover"
										/>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Details */}
					<div className="flex flex-col">
						{/* Badges */}
						<div className="flex gap-2 mb-4">
							{product.is_new ? (
								<span className="bg-accent text-cream text-[0.65rem] tracking-[0.15em] uppercase px-3 py-1">
									New
								</span>
							) : null}
							{product.is_vegan ? (
								<span className="bg-bark text-cream text-[0.65rem] tracking-[0.15em] uppercase px-3 py-1">
									Vegan Leather
								</span>
							) : null}
							{product.is_customisable ? (
								<span className="flex space-x-2 border border-tan text-tan-dark text-[0.65rem] tracking-[0.15em] uppercase px-3 py-1">
									<SparkleIcon className="w-4 h-4" /> <p>Customisable</p>
								</span>
							) : null}
						</div>

						{/* Category */}
						<p className="text-[0.72rem] tracking-[0.2em] uppercase text-tan-dark mb-2">
							{product.category_name}
							{product.leather_type ? ` · ${product.leather_type}` : ""}
						</p>

						{/* Name */}
						<h1 className="font-display font-light text-[clamp(2rem,3.5vw,3rem)] text-bark leading-[1.15] mb-4">
							{product.name}
						</h1>

						{/* Price */}
						<p className="font-display font-semibold text-[2rem] text-bark mb-6">
							R {Number(product.base_price).toLocaleString("en-ZA")}
						</p>

						{/* Description */}
						{product.description && (
							<p className="text-[0.9rem] leading-[1.9] text-bark-mid font-light mb-8">
								{product.description}
							</p>
						)}

						{/* Colour tags */}
						{colourOptions.length > 0 && (
							<div className="mb-6">
								<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
									Colour
									{selectedColour ? (
										<span className="text-tan-dark ml-2 normal-case tracking-normal">
											{selectedColour}
										</span>
									) : (
										<span className="text-bark-mid/50 ml-2 normal-case tracking-normal">
											— please select
										</span>
									)}
								</p>
								<div className="flex gap-2 flex-wrap">
									{colourOptions.map((colour) => (
										<button
											key={colour}
											type="button"
											onClick={() => setSelectedColour(colour)}
											className={`px-4 py-2 text-[0.75rem] tracking-[0.08em] uppercase border cursor-pointer transition-all duration-150 font-body ${
												selectedColour === colour
													? "bg-bark text-cream border-bark"
													: "bg-transparent text-bark-mid border-bark-mid/40 hover:border-bark hover:text-bark"
											}`}
										>
											{colour}
										</button>
									))}
								</div>
							</div>
						)}

						{sizeOptions.length > 0 && (
							<div className="mb-6">
								<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
									Size
									{selectedSize ? (
										<span className="text-tan-dark ml-2 normal-case tracking-normal">
											{selectedSize}
										</span>
									) : (
										<span className="text-bark-mid/50 ml-2 normal-case tracking-normal">
											— please select
										</span>
									)}
								</p>
								<div className="flex gap-2 flex-wrap">
									{sizeOptions.map((size) => (
										<button
											key={size}
											type="button"
											onClick={() => setSelectedSize(size)}
											className={`px-4 py-2 text-[0.75rem] tracking-[0.08em] uppercase border cursor-pointer transition-all duration-150 font-body ${
												selectedSize === size
													? "bg-bark text-cream border-bark"
													: "bg-transparent text-bark-mid border-bark-mid/40 hover:border-bark hover:text-bark"
											}`}
										>
											{size}
										</button>
									))}
								</div>
							</div>
						)}

						{/* Add to cart */}
						<div className="flex gap-3 mb-6">
							<form method="post" action="/cart/add" className="flex-1">
								<input type="hidden" name="productId" value={product.id} />
								<input
									type="hidden"
									name="colour"
									value={selectedColour ?? ""}
								/>
								<input
									type="hidden"
									name="redirectTo"
									value={`/shop/${product.slug}`}
								/>
								<input type="hidden" name="size" value={selectedSize ?? ""} />
								<button
									type="submit"
									disabled={!canAddToCart}
									className="w-full bg-accent text-cream py-3.5 text-[0.8rem] tracking-[0.12em] uppercase hover:bg-bark transition-colors cursor-pointer border-0 disabled:opacity-40 disabled:cursor-not-allowed"
								>
									{canAddToCart
										? "Add to Cart"
										: !selectedColour && colourRequired
										? "Select a Colour"
										: "Select a Size"}
								</button>
							</form>

							{/* Share button */}
							<button
								onClick={handleShare}
								title="Share this product"
								className="border border-tan/40 text-bark-mid px-4 py-3.5 hover:border-tan hover:text-bark transition-colors cursor-pointer bg-transparent flex items-center gap-2"
							>
								{copied ? (
									<>
										<Check size={16} className="text-green-600" />
										<span className="text-[0.72rem] uppercase tracking-wide text-green-600">
											Copied!
										</span>
									</>
								) : (
									<>
										<Share2 size={16} />
										<span className="text-[0.72rem] uppercase tracking-wide">
											Share
										</span>
									</>
								)}
							</button>
						</div>

						{/* Size chart download — shown for Kids categories */}
						{(product.category_name === "Kids Shoes" ||
							product.category_name === "Baby Shoes") && (
							<a
								href="/size-charts/kids-shoes-printable-guide.pdf"
								download
								className="flex items-center gap-2 text-[0.78rem] text-accent hover:underline mb-6 no-underline"
							>
								<Download size={15} />
								Download Printable Foot Guide (PDF)
							</a>
						)}

						{/* Care instructions */}
						{product.care_instructions && (
							<div className="border-t border-tan/20 pt-5 mt-5">
								<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
									Care Instructions
								</p>
								<p className="text-[0.85rem] leading-[1.8] text-bark-mid font-light">
									{product.care_instructions}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
