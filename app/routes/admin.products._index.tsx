import { ActionFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import AdminLayout from "~/components/_layout/admin";
import { pool } from "~/db.server";
import { Share2, Pencil, Check, Trash2, FileDown } from "lucide-react";
import { useState } from "react";

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();
	const _action = form.get("_action") as string;
	const productId = form.get("productId") as string;

	if (_action === "delete") {
		// Delete related images first (foreign key constraint)
		await pool.query("DELETE FROM product_images WHERE product_id = ?", [
			productId,
		]);
		// Delete related variants if any
		await pool.query("DELETE FROM product_variants WHERE product_id = ?", [
			productId,
		]);
		// Delete the product itself
		await pool.query("DELETE FROM products WHERE id = ?", [productId]);
	}

	return json({ ok: true });
}

export async function loader() {
	const [products] = await pool.query(`
    SELECT p.id, p.name, p.base_price, p.is_active, p.is_new,
           c.name AS category, lt.name AS leather_type
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN leather_types lt ON p.leather_type_id = lt.id
    ORDER BY p.created_at DESC
  `);
	return json({ products });
}

export default function ProductsList() {
	const { products } = useLoaderData<typeof loader>();

	return (
		<AdminLayout>
			<div className="flex items-center justify-between mb-8">
				<h1 className="font-display font-light text-3xl text-bark">Products</h1>
				<Link
					to="/admin/products/new"
					className="bg-accent text-white px-6 py-2 text-sm tracking-wider uppercase hover:bg-bark transition-colors no-underline"
				>
					+ Add Product
				</Link>
			</div>

			<div className="justify-start mb-4 w-full flex">
				<a
					href="/admin/export/orders"
					className="flex items-center gap-2 border border-tan/40 text-bark-mid px-4 py-2 text-[0.75rem] tracking-[0.1em] uppercase no-underline hover:border-tan hover:text-bark transition-colors"
				>
					<FileDown size={14} />
					Export Table
				</a>
			</div>

			<div className="bg-white border border-tan/30 rounded overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-cream border-b border-tan/30">
						<tr>
							{["Name", "Category", "Leather", "Price", "Status", ""].map(
								(h) => (
									<th
										key={h}
										className="text-left px-4 py-3 text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid font-normal"
									>
										{h}
									</th>
								),
							)}
						</tr>
					</thead>
					<tbody>
						{(products as any[]).map((p, i) => (
							<tr
								key={p.id}
								className={`border-b border-tan/20 hover:bg-cream/50 transition-colors ${
									i % 2 === 0 ? "" : "bg-cream/20"
								}`}
							>
								<td className="px-4 py-3 font-medium text-bark">
									{p.name}
									{p.is_new ? (
										<span className="ml-2 text-[0.65rem] bg-accent text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
											New
										</span>
									) : null}
								</td>
								<td className="px-4 py-3 text-bark-mid">{p.category}</td>
								<td className="px-4 py-3 text-bark-mid">
									{p.leather_type ?? "—"}
								</td>
								<td className="px-4 py-3 text-bark font-medium">
									R {Number(p.base_price).toFixed(2)}
								</td>
								<td className="px-4 py-3">
									<span
										className={`text-[0.7rem] px-2 py-0.5 rounded uppercase tracking-wide ${
											p.is_active
												? "bg-green-100 text-green-700"
												: "bg-gray-100 text-gray-500"
										}`}
									>
										{p.is_active ? "Active" : "Hidden"}
									</span>
								</td>
								<td className="px-4 py-3 text-right flex items-center justify-end gap-3">
									{/* Share */}
									<ShareButton
										slug={p.slug}
										name={p.name}
										price={p.base_price}
									/>

									{/* Edit */}
									<Link
										to={`/admin/products/${p.id}/edit`}
										className="text-accent text-[0.78rem] hover:underline no-underline"
									>
										Edit
									</Link>

									{/* Delete */}
									<Form
										method="post"
										onSubmit={(e) => {
											if (
												!confirm(`Delete "${p.name}"? This can't be undone.`)
											) {
												e.preventDefault();
											}
										}}
									>
										<input type="hidden" name="_action" value="delete" />
										<input type="hidden" name="productId" value={p.id} />
										<button
											type="submit"
											className="text-red-500 text-xs hover:text-red-700 transition-colors cursor-pointer bg-transparent border-0"
											title="Delete product"
										>
											Delete
										</button>
									</Form>
								</td>
							</tr>
						))}
						{(products as any[]).length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-12 text-center text-bark-mid text-sm"
								>
									No products yet.{" "}
									<Link to="/admin/products/new" className="text-accent">
										Add your first one →
									</Link>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</AdminLayout>
	);
}

function ShareButton({
	slug,
	name,
	price,
}: {
	slug: string;
	name: string;
	price: number;
}) {
	const [copied, setCopied] = useState(false);

	async function handleShare() {
		const url = `${window.location.origin}/shop/${slug}`;
		const text = `Check out ${name} on Tjiane Creations — R ${Number(
			price,
		).toLocaleString("en-ZA")}`;

		if (navigator.share) {
			try {
				await navigator.share({ title: name, text, url });
			} catch {
				// cancelled
			}
		} else {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		}
	}

	return (
		<button
			onClick={handleShare}
			title="Share product"
			className="flex items-center gap-1.5 text-[0.72rem] text-bark-mid hover:text-accent transition-colors cursor-pointer bg-transparent border-0 p-0"
		>
			{copied ? (
				<>
					<Check size={13} className="text-green-600" />
					<span className="text-green-600">Copied!</span>
				</>
			) : (
				<>
					<Share2 size={13} />
					<span>Share</span>
				</>
			)}
		</button>
	);
}
