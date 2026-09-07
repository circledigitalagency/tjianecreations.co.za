import { json } from "@remix-run/node";
import type {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
} from "@remix-run/node";
import { useLoaderData, useNavigate, Form } from "@remix-run/react";
import * as React from "react";
import {
	Share2,
	Check,
	ArrowLeft,
	SparkleIcon,
	Download,
	ChevronDown,
} from "lucide-react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";
import { addToCart } from "~/cart.server";
import { redirect } from "@remix-run/node";

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ params }: LoaderFunctionArgs) {
	const { slug } = params;

	const [[product]] = (await pool.query(
		`SELECT
      p.id, p.slug, p.name, p.base_price, p.description, p.colours, p.sizes,
      p.care_instructions, p.is_new,
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

	// Load all colours with swatch images
	const [colours] = (await pool.query(
		`SELECT id, name, hex_value, swatch_image FROM colours ORDER BY name`,
	)) as any;

	const appUrl = process.env.APP_URL ?? "http://localhost:5173";

	return json({ product, images, colours, appUrl });
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();
	const productId = parseInt(form.get("productId") as string);
	const colourName = form.get("colour_name") as string | null;
	const size = (form.get("size") as string)?.trim() || null;
	const engravingText = (form.get("engraving_text") as string)?.trim() || null;
	const needBefore = (form.get("need_before") as string)?.trim() || null;
	const price = parseFloat(form.get("price") as string);
	const name = form.get("product_name") as string;
	const imageUrl = form.get("image_url") as string | null;

	let customisation = "";
	if (engravingText) customisation += `Engraving: ${engravingText}`;
	if (needBefore)
		customisation += (customisation ? " | " : "") + `Needed by: ${needBefore}`;

	const response = await addToCart(request, {
		productId,
		variantId: null,
		name,
		price,
		quantity: 1,
		imageUrl: imageUrl || null,
		colour: colourName || null,
		size: size || null,
		customisationText: customisation || null,
	});

	// Get the Set-Cookie header from the cart response
	const cookie = response.headers.get("Set-Cookie");

	return redirect("/cart", {
		headers: cookie ? { "Set-Cookie": cookie } : {},
	});
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

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
				`Handcrafted leather by Tjiane Creations. R ${Number(
					product.base_price,
				).toLocaleString("en-ZA")}`,
		},
		{ property: "og:title", content: product.name },
		{
			property: "og:description",
			content:
				product.description ??
				`R ${Number(product.base_price).toLocaleString(
					"en-ZA",
				)} · Handcrafted leather`,
		},
		{ property: "og:image", content: image ? `${appUrl}${image}` : "" },
		{ property: "og:url", content: url },
		{ property: "og:type", content: "product" },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: product.name },
		{
			name: "twitter:description",
			content: `R ${Number(product.base_price).toLocaleString(
				"en-ZA",
			)} · Tjiane Creations`,
		},
		{ name: "twitter:image", content: image ? `${appUrl}${image}` : "" },
	];
};

// ─── Accordion ────────────────────────────────────────────────────────────────

function Accordion({
	title,
	children,
	defaultOpen = false,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = React.useState(defaultOpen);
	return (
		<div className="border-t border-tan/20">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="w-full flex items-center justify-between py-4 text-left bg-transparent border-0 cursor-pointer"
			>
				<span className="text-[0.78rem] font-medium tracking-[0.08em] uppercase text-bark">
					{title}
				</span>
				<ChevronDown
					size={16}
					className={`text-bark-mid transition-transform duration-200 ${
						open ? "rotate-180" : ""
					}`}
				/>
			</button>
			{open && (
				<div className="pb-5 text-[0.85rem] text-bark-mid leading-relaxed font-light">
					{children}
				</div>
			)}
		</div>
	);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductDetail() {
	const { product, images, colours } = useLoaderData<typeof loader>();

	const [activeImage, setActiveImage] = React.useState(0);
	const [selectedColour, setSelectedColour] = React.useState<number | null>(
		null,
	);
	const [selectedSize, setSelectedSize] = React.useState<string | null>(null);
	const [engraving, setEngraving] = React.useState(false);
	const [engravingText, setEngravingText] = React.useState("");
	const [needBefore, setNeedBefore] = React.useState("");
	const [copied, setCopied] = React.useState(false);
	const [lightbox, setLightbox] = React.useState<string | null>(null);

	const navigate = useNavigate();

	const productColours =
		product.category_name === "Hats" ? [] : (colours as any[]);

	// Parse sizes
	const sizes: string[] = (product.sizes ?? "")
		.split(",")
		.map((s: string) => s.trim())
		.filter(Boolean);

	const colourRequired = productColours.length > 0;
	const sizeRequired = sizes.length > 0;
	const canAddToCart =
		(!colourRequired || selectedColour !== null) &&
		(!sizeRequired || selectedSize !== null);

	const basePrice = Number(product.base_price);
	const engravingFee = engraving ? 100 : 0;
	const totalPrice = basePrice + engravingFee;

	// Keyboard nav between images
	React.useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "ArrowRight")
				setActiveImage((prev) =>
					Math.min(prev + 1, (images as any[]).length - 1),
				);
			if (e.key === "ArrowLeft")
				setActiveImage((prev) => Math.max(prev - 1, 0));
			if (e.key === "Escape") setLightbox(null);
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
		if (navigator.share) {
			try {
				await navigator.share(shareData);
			} catch {}
		} else {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		}
	}

	return (
		<MainLayout>
			<div className="px-8 md:px-16 py-10 max-w-7xl mx-auto">
				{/* Back button */}
				<button
					onClick={() => navigate(-1)}
					className="inline-flex items-center gap-2 text-[0.78rem] tracking-[0.1em] uppercase text-bark-mid hover:text-accent transition-colors cursor-pointer bg-transparent border-0 p-0 mb-8"
				>
					<ArrowLeft size={15} />
					Back
				</button>

				{/* ── Main grid ── */}
				<div className="grid md:grid-cols-[55fr_45fr] gap-14 items-start">
					{/* ── LEFT: Gallery ── */}
					<div>
						{/* Hero image */}
						<div
							className="relative overflow-hidden bg-gradient-to-br from-tan-light to-tan mb-3 cursor-zoom-in"
							style={{ aspectRatio: "4/3" }}
							onClick={() => {
								const url = (images as any[])[activeImage]?.url;
								if (url) setLightbox(url);
							}}
						>
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
							{product.is_new && (
								<span className="absolute top-3 left-3 bg-accent text-cream text-[0.62rem] tracking-[0.1em] uppercase px-2.5 py-1">
									New
								</span>
							)}
						</div>

						{/* Thumbnails */}
						{(images as any[]).length > 1 && (
							<div className="flex gap-2 overflow-x-auto pb-1">
								{(images as any[]).map((img, i) => (
									<button
										key={i}
										onClick={() => setActiveImage(i)}
										className={`flex-shrink-0 w-20 h-20 overflow-hidden border-0 p-0 cursor-pointer transition-all ${
											activeImage === i
												? "ring-2 ring-bark"
												: "opacity-55 hover:opacity-100"
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

					{/* ── RIGHT: Product info ── */}
					<div className="sticky top-24">
						{/* Badges */}
						<div className="flex gap-2 mb-3 flex-wrap">
							{/* {product.is_vegan && (
								<span className="bg-bark text-cream text-[0.65rem] tracking-[0.15em] uppercase px-3 py-1">
									Vegan Leather
								</span>
							)} */}
							{product.category_name !== "Hats" && (
								<span className="flex items-center gap-1.5 border border-tan text-tan-dark text-[0.65rem] tracking-[0.15em] uppercase px-3 py-1">
									<SparkleIcon className="w-3.5 h-3.5" /> Customisable
								</span>
							)}
						</div>

						{/* Category + leather type */}
						<p className="text-[0.72rem] tracking-[0.2em] uppercase text-tan-dark mb-2">
							{product.category_name}
							{product.leather_type ? ` · ${product.leather_type}` : ""}
						</p>

						{/* Name */}
						<h1 className="font-display font-light text-[clamp(1.8rem,3vw,2.6rem)] text-bark leading-[1.15] mb-4">
							{product.name}
						</h1>

						{/* Price */}
						<div className="mb-1">
							<span className="font-display font-semibold text-[2rem] text-bark">
								R {totalPrice.toLocaleString("en-ZA")}
							</span>
							{engraving && (
								<span className="ml-2 text-[0.72rem] text-tan-dark">
									(incl. R100 engraving)
								</span>
							)}
						</div>
						<p className="text-[0.72rem] text-bark-mid/50 mb-6">
							Shipping calculated at checkout.
						</p>

						<Form method="post" className="space-y-6">
							<input type="hidden" name="productId" value={product.id} />
							<input type="hidden" name="product_name" value={product.name} />
							<input
								type="hidden"
								name="image_url"
								value={(images as any[])[0]?.url ?? ""}
							/>
							<input type="hidden" name="price" value={totalPrice} />
							<input type="hidden" name="size" value={selectedSize ?? ""} />

							{/* Replace colour_id with colour_name */}
							<input
								type="hidden"
								name="colour_name"
								value={
									selectedColour
										? (colours as any[]).find(
												(c: any) => c.id === selectedColour,
										  )?.name ?? ""
										: ""
								}
							/>

							{/* ── Leather swatches ── */}
							{product.category_name !== "Hats" &&
								productColours.length > 0 && (
									<div>
										<p className="text-[0.72rem] tracking-[0.12em] uppercase text-bark-mid mb-3">
											Choose your leather
											{selectedColour && (
												<span className="ml-2 normal-case tracking-normal text-tan-dark font-normal">
													—{" "}
													{
														productColours.find(
															(c: any) => c.id === selectedColour,
														)?.name
													}
												</span>
											)}
										</p>
										<div className="flex flex-col gap-2">
											{productColours.map((colour: any) => (
												<button
													key={colour.id}
													type="button"
													onClick={() => setSelectedColour(colour.id)}
													className={`flex items-center gap-3 p-1 pr-4 border transition-all cursor-pointer bg-transparent text-left ${
														selectedColour === colour.id
															? "border-bark"
															: "border-tan/30 hover:border-bark-mid"
													}`}
												>
													{colour.swatch_image ? (
														<img
															src={colour.swatch_image}
															alt={colour.name}
															className="w-14 h-14 object-cover flex-shrink-0"
														/>
													) : (
														<div
															className="w-14 h-14 flex-shrink-0"
															style={{ backgroundColor: colour.hex_value }}
														/>
													)}
													<span className="text-[0.85rem] text-bark flex-1">
														{colour.name}
													</span>
													{selectedColour === colour.id && (
														<Check size={15} className="text-bark ml-auto" />
													)}
												</button>
											))}
										</div>
										{colourRequired && selectedColour === null && (
											<p className="text-[0.72rem] text-accent mt-1.5">
												Please select a leather to continue
											</p>
										)}
									</div>
								)}

							{/* ── Sizes ── */}
							{sizes.length > 0 && (
								<div>
									<p className="text-[0.72rem] tracking-[0.12em] uppercase text-bark-mid mb-3">
										Size
									</p>
									<div className="flex flex-wrap gap-2">
										{sizes.map((size: string) => (
											<button
												key={size}
												type="button"
												onClick={() => setSelectedSize(size)}
												className={`px-4 py-2 text-[0.78rem] border cursor-pointer transition-all${
													selectedSize === size
														? "border-bark bg-bark text-cream"
														: "border-tan/40 text-bark-mid hover:border-bark bg-transparent "
												}`}
											>
												{size}
											</button>
										))}
									</div>
									{sizeRequired && selectedSize === null && (
										<p className="text-[0.72rem] text-accent mt-1.5">
											Please select a size
										</p>
									)}
								</div>
							)}

							{/* ── Engraving ── */}
							{product.category_name !== "Hats" && (
								<div>
									<p className="text-[0.72rem] tracking-[0.12em] uppercase text-bark-mid mb-3">
										Would you like us to engrave this for you?
									</p>
									<div className="flex flex-col gap-2 mb-3">
										<label className="flex items-center gap-2.5 cursor-pointer text-[0.85rem] text-bark">
											<input
												type="radio"
												name="engraving_choice"
												checked={engraving}
												onChange={() => setEngraving(true)}
												className="accent-bark w-4 h-4"
											/>
											Yes please (+R100)
										</label>
										<label className="flex items-center gap-2.5 cursor-pointer text-[0.85rem] text-bark">
											<input
												type="radio"
												name="engraving_choice"
												checked={!engraving}
												onChange={() => {
													setEngraving(false);
													setEngravingText("");
													setNeedBefore("");
												}}
												className="accent-bark w-4 h-4"
											/>
											No thanks
										</label>
									</div>

									{engraving && (
										<div className="space-y-3 pl-0">
											<div>
												<label className="block text-[0.72rem] tracking-[0.12em] uppercase text-bark-mid mb-1.5">
													Engraving Caption
												</label>
												<input
													type="text"
													name="engraving_text"
													value={engravingText}
													onChange={(e) => setEngravingText(e.target.value)}
													placeholder="Your engraving text here"
													maxLength={80}
													className="w-full border border-tan/40 bg-white text-bark px-3 py-2.5 text-[0.85rem] outline-none focus:border-bark transition-colors font-body"
												/>
											</div>
											<div>
												<label className="block text-[0.72rem] tracking-[0.12em] uppercase text-bark-mid mb-1.5">
													Need before date (DD/MM/YYYY)
												</label>
												<input
													type="text"
													name="need_before"
													value={needBefore}
													onChange={(e) => setNeedBefore(e.target.value)}
													placeholder="DD/MM/YYYY"
													className="w-full border border-tan/40 bg-white text-bark px-3 py-2.5 text-[0.85rem] outline-none focus:border-bark transition-colors font-body"
												/>
											</div>
										</div>
									)}
								</div>
							)}

							{/* ── Add to cart + Share ── */}
							<div className="flex gap-3">
								<button
									type="submit"
									disabled={!canAddToCart}
									className="flex-1 bg-accent text-cream py-4 text-[0.78rem] tracking-[0.12em] uppercase hover:bg-bark transition-colors cursor-pointer border-0 disabled:opacity-40 disabled:cursor-not-allowed"
								>
									{canAddToCart
										? `Add to Cart — R ${totalPrice.toLocaleString("en-ZA")}`
										: "Select options above"}
								</button>

								<button
									type="button"
									onClick={handleShare}
									title="Share this product"
									className="border border-tan/40 text-bark-mid px-4 hover:border-tan hover:text-bark transition-colors cursor-pointer bg-transparent flex items-center gap-2 flex-shrink-0"
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

							<p className="text-[0.72rem] text-bark-mid/50 text-center -mt-2">
								Handcrafted to order · Allow 7–14 business days
							</p>
						</Form>

						{/* ── Size chart download ── */}
						{(product.category_name === "Kids Shoes" ||
							product.category_name === "Baby Shoes") && (
							<a
								href="/size-charts/kids-shoes-printable-guide.pdf"
								download
								className="flex items-center gap-2 text-[0.78rem] text-accent hover:underline mt-4 no-underline"
							>
								<Download size={15} />
								Download Printable Foot Guide (PDF)
							</a>
						)}

						{/* ── Accordion sections ── */}
						<div className="mt-8">
							{product.description && (
								<Accordion title="Description" defaultOpen>
									<p className="whitespace-pre-line">{product.description}</p>
								</Accordion>
							)}

							{product.leather_type && (
								<Accordion title="Materials">
									<p>
										Made from <strong>{product.leather_type}</strong>.
										{product.is_vegan ? " This is a vegan leather option." : ""}
										{productColours.length > 0
											? " Available in the leather colours shown above."
											: ""}
									</p>
								</Accordion>
							)}

							{product.care_instructions && (
								<Accordion title="Care Instructions">
									<p className="whitespace-pre-line">
										{product.care_instructions}
									</p>
								</Accordion>
							)}

							<Accordion title="Shipping & Returns">
								<div className="space-y-2">
									<p>
										All orders ship via The Courier Guy once completed (allow
										7–14 business days for handcrafted pieces).
									</p>
									<p className="mt-2">Shipping options:</p>
									<ul className="space-y-1 mt-1 list-none">
										<li>· Door-to-door — From R120</li>
									</ul>
									<p className="mt-3">
										Returns accepted within 7 days for manufacturing defects.
										Contact us to arrange.
									</p>
								</div>
							</Accordion>
						</div>
					</div>
				</div>
			</div>

			{/* ── Lightbox ── */}
			{lightbox && (
				<div
					onClick={() => setLightbox(null)}
					className="fixed inset-0 z-[100] bg-bark/90 flex items-center justify-center p-8 cursor-pointer"
				>
					<img
						src={lightbox}
						alt="Product"
						className="max-w-full max-h-full object-contain"
					/>
					<button
						onClick={() => setLightbox(null)}
						className="absolute top-6 right-6 text-cream text-3xl bg-transparent border-0 cursor-pointer"
						aria-label="Close"
					>
						×
					</button>
				</div>
			)}
		</MainLayout>
	);
}
