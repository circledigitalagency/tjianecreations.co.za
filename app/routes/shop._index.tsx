import { json } from "@remix-run/node";
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";

export const meta: MetaFunction = () => [
	{ title: "Shop — Tjiane Creations" },
	{
		name: "description",
		content: "Browse our handcrafted leather bag collection.",
	},
];

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const category = url.searchParams.get("category");

	// Get all active categories for the filter bar
	const [categories] = (await pool.query(
		"SELECT id, slug, name FROM categories WHERE is_active = 1 ORDER BY sort_order",
	)) as any;

	// Get products — filter by category slug if one is selected
	const [products] = (await pool.query(
		`SELECT
      p.id,
      p.slug,
      p.name,
      p.base_price,
      p.is_new,
      p.is_customisable,
      c.name  AS category_name,
      c.slug  AS category_slug,
      lt.name AS leather_type,
      lt.is_vegan,
      -- First image only (sort_order = 0 is hero)
      (SELECT url FROM product_images pi
       WHERE pi.product_id = p.id
       ORDER BY pi.sort_order LIMIT 1) AS image_url
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN leather_types lt ON p.leather_type_id = lt.id
    WHERE p.is_active = 1
    ${category ? "AND c.slug = ?" : ""}
    ORDER BY p.is_new DESC, p.created_at DESC`,
		category ? [category] : [],
	)) as any;

	return json({ products, categories, activeCategory: category ?? "all" });
}

export default function Shop() {
	const { products, categories, activeCategory } =
		useLoaderData<typeof loader>();
	const [searchParams, setSearchParams] = useSearchParams();

	function setCategory(slug: string) {
		if (slug === "all") {
			setSearchParams({});
		} else {
			setSearchParams({ category: slug });
		}
	}

	return (
		<MainLayout>
			{/* Page header */}
			<div className="px-16 pt-16 pb-8 border-b border-tan/30">
				<span className="text-eyebrow text-tan-dark block mb-2">
					Ready to Buy
				</span>
				<h1 className="font-display font-light text-[clamp(2.5rem,4vw,4rem)] text-bark">
					The <em className="italic text-accent">Collection</em>
				</h1>
			</div>

			{/* Category filter */}
			<div className="px-16 py-6 flex gap-3 flex-wrap border-b border-tan/20">
				<button
					onClick={() => setCategory("all")}
					className={`px-5 py-2 text-[0.72rem] tracking-[0.12em] uppercase transition-all duration-200 border cursor-pointer font-body ${
						activeCategory === "all"
							? "bg-bark text-cream border-bark"
							: "bg-transparent text-bark-mid border-bark-mid/40 hover:border-bark-mid hover:text-bark"
					}`}
				>
					All
				</button>
				{(categories as any[]).map((cat) => (
					<button
						key={cat.slug}
						onClick={() => setCategory(cat.slug)}
						className={`px-5 py-2 text-[0.72rem] tracking-[0.12em] uppercase transition-all duration-200 border cursor-pointer font-body ${
							activeCategory === cat.slug
								? "bg-bark text-cream border-bark"
								: "bg-transparent text-bark-mid border-bark-mid/40 hover:border-bark-mid hover:text-bark"
						}`}
					>
						{cat.name}
					</button>
				))}
			</div>

			{/* Product grid */}
			<div className="px-16 py-16">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{(products as any[]).map((product) => (
						<Link
							key={product.id}
							to={`/shop/${product.slug}`}
							className="no-underline block bg-cream-white cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(44,31,20,0.12)]"
						>
							<div>
								{/* Image or fallback gradient */}
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

									{/* Badges */}
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
									<div className="text-[0.72rem] tracking-[0.12em] uppercase text-tan-dark mb-1">
										{product.category_name}
									</div>
									{product.leather_type && (
										<div className="text-[0.7rem] text-bark-mid mb-3">
											{product.leather_type}
										</div>
									)}
									<div className="flex items-center justify-between mt-3">
										<span className="font-display font-semibold text-[1.2rem] text-bark">
											R {Number(product.base_price).toLocaleString("en-ZA")}
										</span>
										<Form method="post" action="/cart/add">
											<input
												type="hidden"
												name="productId"
												value={product.id}
											/>
											<input type="hidden" name="redirectTo" value="/shop" />
											<button
												type="submit"
												className="bg-bark text-cream py-2 px-4 text-[0.72rem] tracking-[0.1em] uppercase font-body transition-colors hover:bg-accent cursor-pointer border-0"
											>
												Add to Cart
											</button>
										</Form>
									</div>
								</div>
							</div>
						</Link>
					))}
				</div>

				{(products as any[]).length === 0 && (
					<div className="text-center py-24">
						<p className="font-display italic text-2xl text-bark-mid">
							No products in this category yet.
						</p>
						<button
							onClick={() => setCategory("all")}
							className="mt-6 text-nav text-accent border-b border-accent pb-0.5"
						>
							View all products
						</button>
					</div>
				)}
			</div>
		</MainLayout>
	);
}
