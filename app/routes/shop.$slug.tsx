import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import * as React from "react";
import { Share2, Check, Link as LinkIcon, ArrowLeft } from "lucide-react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";
import { Download } from "lucide-react";

export async function loader({ params }: LoaderFunctionArgs) {
	const { slug } = params;

	const [[product]] = (await pool.query(
		`SELECT
      p.id, p.slug, p.name, p.base_price, p.description,
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

// ✅ Open Graph meta tags — these control how the product looks when shared
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
	const [activeImage, setActiveImage] = React.useState(0);
	const [copied, setCopied] = React.useState(false);
	const [addedToCart, setAddedToCart] = React.useState(false);

	const navigate = useNavigate();

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
								<span className="border border-tan text-tan-dark text-[0.65rem] tracking-[0.15em] uppercase px-3 py-1">
									Customisable
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

						{/* Add to cart */}
						<div className="flex gap-3 mb-6">
							<form method="post" action="/cart/add" className="flex-1">
								<input type="hidden" name="productId" value={product.id} />
								<input
									type="hidden"
									name="redirectTo"
									value={`/shop/${product.slug}`}
								/>
								<button
									type="submit"
									className="w-full bg-accent text-cream py-3.5 text-[0.8rem] tracking-[0.12em] uppercase hover:bg-bark transition-colors cursor-pointer border-0"
								>
									Add to Cart
								</button>
							</form>

							{/* Size chart download — shown only for Kids Shoes */}
							{product.category_name === "Kids Shoes" && (
								<a
									href="/size-charts/kids-shoes-printable-guide.pdf"
									download
									className="flex items-center gap-2 text-[0.78rem] text-accent hover:underline mb-6"
								>
									<Download size={15} />
									Download Printable Foot Guide (PDF)
								</a>
							)}

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

function SocialShareButtons({ product }: { product: any }) {
	const [url, setUrl] = React.useState("");

	// Get the URL client-side only
	React.useEffect(() => {
		setUrl(window.location.href);
	}, []);

	const text = encodeURIComponent(
		`Check out ${product.name} on Tjiane Creations — R ${Number(
			product.base_price,
		).toLocaleString("en-ZA")}`,
	);
	const encodedUrl = encodeURIComponent(url);

	const platforms = [
		{
			name: "WhatsApp",
			href: `https://wa.me/?text=${text}%20${encodedUrl}`,
			bg: "bg-[#25D366]",
			icon: "W",
		},
		{
			name: "Facebook",
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
			bg: "bg-[#1877F2]",
			icon: "f",
		},
		{
			name: "X / Twitter",
			href: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
			bg: "bg-[#000000]",
			icon: "𝕏",
		},
		{
			name: "Copy Link",
			href: url,
			bg: "bg-bark",
			icon: <LinkIcon size={13} />,
			isCopy: true,
		},
	];

	const [copied, setCopied] = React.useState(false);

	async function copyLink() {
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2500);
	}

	return (
		<div className="flex gap-2 flex-wrap">
			{platforms.map(({ name, href, bg, icon, isCopy }) =>
				isCopy ? (
					<button
						key={name}
						onClick={copyLink}
						className={`${bg} text-white px-4 py-2 text-[0.72rem] tracking-wide uppercase flex items-center gap-2 cursor-pointer border-0 transition-opacity hover:opacity-80`}
					>
						{icon}
						{copied ? "Copied!" : name}
					</button>
				) : (
					<a
						key={name}
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className={`${bg} text-white px-4 py-2 text-[0.72rem] tracking-wide uppercase flex items-center gap-2 no-underline transition-opacity hover:opacity-80`}
					>
						<span className="font-bold text-sm">{icon}</span>
						{name}
					</a>
				),
			)}
		</div>
	);
}
