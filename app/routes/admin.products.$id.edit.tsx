import {
	json,
	redirect,
	unstable_parseMultipartFormData,
} from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
	Form,
	useLoaderData,
	useActionData,
	useNavigation,
} from "@remix-run/react";
import path from "path";
import AdminLayout from "~/components/_layout/admin";
import { pool } from "~/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
	const { id } = params;

	const [[product]] = (await pool.query("SELECT * FROM products WHERE id = ?", [
		id,
	])) as any;

	if (!product) throw new Response("Product not found", { status: 404 });

	const [images] = (await pool.query(
		"SELECT id, url, alt_text, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order",
		[id],
	)) as any;
	const [categories] = (await pool.query(
		"SELECT id, name FROM categories ORDER BY name",
	)) as any;
	const [leatherTypes] = (await pool.query(
		"SELECT id, name, is_vegan FROM leather_types",
	)) as any;

	return json({ product, images, categories, leatherTypes });
}

export async function action({ request, params }: ActionFunctionArgs) {
	const { id } = params;
	const contentType = request.headers.get("content-type") ?? "";

	// Plain form post = delete image action
	if (!contentType.includes("multipart/form-data")) {
		const form = await request.formData();
		if (form.get("_action") === "delete_image") {
			const imageId = form.get("image_id");
			await pool.query(
				"DELETE FROM product_images WHERE id = ? AND product_id = ?",
				[imageId, id],
			);
			return redirect(`/admin/products/${id}/edit`);
		}
	}

	// Multipart = main save form, handled by the custom upload handler
	const uploadHandler = async (part: any) => {
		if (part.filename !== undefined) {
			// It's a file field
			if (!part.filename || part.filename === "") {
				// Empty file input — drain and skip
				for await (const _ of part.data) {
					/* drain */
				}
				return "";
			}

			const bytes = [];
			for await (const chunk of part.data) {
				bytes.push(chunk);
			}
			const buffer = Buffer.concat(bytes);
			const filePath = path.join(
				process.cwd(),
				"public/images/products",
				part.filename,
			);
			await import("fs/promises").then((fs) => fs.writeFile(filePath, buffer));
			return part.filename;
		}

		// Text field — read as string
		const chunks = [];
		for await (const chunk of part.data) {
			chunks.push(chunk);
		}
		return Buffer.concat(chunks).toString("utf-8");
	};

	const form = await unstable_parseMultipartFormData(request, uploadHandler);

	const name = form.get("name") as string;
	const slug = name
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");
	const category_id = form.get("category_id");
	const leather_type_id = form.get("leather_type_id") || null;
	const base_price = parseFloat(form.get("base_price") as string);
	const description = form.get("description");
	const care = form.get("care_instructions");
	const colours = (form.get("colours") as string)?.trim() || null;
	const sizes = (form.get("sizes") as string)?.trim() || null;
	const is_customisable = form.get("is_customisable") === "on" ? 1 : 0;
	const is_new = form.get("is_new") === "on" ? 1 : 0;
	const is_active = form.get("is_active") === "on" ? 1 : 0;

	if (!name || !category_id || isNaN(base_price)) {
		return json(
			{ error: "Name, category and price are required." },
			{ status: 400 },
		);
	}

	await pool.query(
		`UPDATE products SET
      slug = ?, name = ?, category_id = ?, leather_type_id = ?, colours = ?, sizes = ?,
      base_price = ?, description = ?, care_instructions = ?,
      is_customisable = ?, is_new = ?, is_active = ?
     WHERE id = ?`,
		[
			slug,
			name,
			category_id,
			leather_type_id,
			colours,
			sizes,
			base_price,
			description,
			care,
			is_customisable,
			is_new,
			is_active,
			id,
		],
	);

	// New images continue sort_order after existing ones
	const [[{ maxSort }]] = (await pool.query(
		"SELECT COALESCE(MAX(sort_order), -1) AS maxSort FROM product_images WHERE product_id = ?",
		[id],
	)) as any;

	let sortOrder = maxSort + 1;
	for (let i = 0; i < 5; i++) {
		const filename = form.get(`image_${i}`) as string | null;
		if (filename && filename !== "") {
			const imageUrl = `/images/products/${filename}`;
			await pool.query(
				"INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?)",
				[id, imageUrl, name, sortOrder],
			);
			sortOrder++;
		}
	}

	return redirect("/admin/products");
}

export default function EditProduct() {
	const { product, images, categories, leatherTypes } =
		useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";

	return (
		<AdminLayout>
			<div className="max-w-2xl">
				<div className="mb-8">
					<h1 className="font-display font-light text-3xl text-bark">
						Edit Product
					</h1>
					<p className="text-sm text-bark-mid mt-1">{product.name}</p>
				</div>

				{actionData?.error && (
					<div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
						{actionData.error}
					</div>
				)}

				<Form method="post" encType="multipart/form-data" className="space-y-6">
					<Field label="Product Name *">
						<input
							name="name"
							type="text"
							required
							defaultValue={product.name}
							className="field"
						/>
					</Field>

					<Field label="Category *">
						<select
							name="category_id"
							required
							defaultValue={product.category_id}
							className="field"
						>
							{(categories as any[]).map((c) => (
								<option key={c.id} value={c.id}>
									{c.name}
								</option>
							))}
						</select>
					</Field>

					<Field label="Base Price (ZAR) *">
						<input
							name="base_price"
							type="number"
							step="0.01"
							min="0"
							required
							defaultValue={product.base_price}
							className="field"
						/>
					</Field>

					<Field label="Leather Type">
						<select
							name="leather_type_id"
							defaultValue={product.leather_type_id ?? ""}
							className="field"
						>
							<option value="">Select leather type…</option>
							{(leatherTypes as any[]).map((l) => (
								<option key={l.id} value={l.id}>
									{l.name} {l.is_vegan ? "(Vegan)" : ""}
								</option>
							))}
						</select>
					</Field>

					<Field label="Colours (comma separated)">
						<input
							name="colours"
							type="text"
							placeholder="e.g. Mustard, Blue"
							defaultValue={product.colours ?? ""}
							className="field"
						/>
						<p className="text-[0.72rem] text-bark-mid mt-1">
							Customers will pick one of these when adding to cart. Leave empty
							if the product comes in one colour only.
						</p>
					</Field>

					<Field label="Sizes (comma separated)">
						<input
							name="sizes"
							type="text"
							placeholder="e.g. Size 1, Size 2, Size 3"
							defaultValue={product?.sizes ?? ""}
							className="field"
						/>
						<p className="text-[0.72rem] text-bark-mid mt-1">
							Customers will pick one when adding to cart. Leave empty for
							one-size items.
						</p>
					</Field>

					<Field label="Description">
						<textarea
							name="description"
							rows={4}
							className="field resize-y"
							defaultValue={product.description ?? ""}
						/>
					</Field>

					<Field label="Care Instructions">
						<textarea
							name="care_instructions"
							rows={3}
							className="field resize-y"
							defaultValue={product.care_instructions ?? ""}
						/>
					</Field>

					{/* Existing images */}
					{images.length > 0 && (
						<Field label="Current Images">
							<div className="flex flex-wrap gap-3">
								{(images as any[]).map((img) => (
									<div key={img.id} className="relative group">
										<img
											src={img.url}
											alt={img.alt_text}
											className="w-24 h-24 object-cover border border-tan/30 rounded"
										/>
										{img.sort_order === 0 && (
											<span className="absolute bottom-1 left-1 bg-bark/70 text-cream text-[0.55rem] tracking-wide uppercase px-1.5 py-0.5 rounded-sm">
												Hero
											</span>
										)}
										{/* Delete image button — plain form (no multipart) */}
										<Form method="post">
											<input
												type="hidden"
												name="_action"
												value="delete_image"
											/>
											<input type="hidden" name="image_id" value={img.id} />
											<button
												type="submit"
												className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-0 flex items-center justify-center"
												title="Remove image"
											>
												×
											</button>
										</Form>
									</div>
								))}
							</div>
						</Field>
					)}

					{/* Image upload — up to 5 separate slots */}
					<Field label="Add Images">
						<div className="grid grid-cols-5 gap-3">
							{[0, 1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className="border-2 border-dashed border-tan/40 rounded p-3 text-center hover:border-tan transition-colors"
								>
									<input
										type="file"
										name={`image_${i}`}
										accept="image/jpeg,image/png,image/webp"
										className="w-full text-[0.65rem] text-bark-mid cursor-pointer"
									/>
								</div>
							))}
						</div>
						<p className="text-[0.72rem] text-bark-mid mt-2">
							JPG, PNG or WebP — max 5MB each. New images are added after the
							existing ones.
						</p>
					</Field>

					<div className="flex gap-8">
						<label className="flex items-center gap-2 text-sm text-bark cursor-pointer">
							<input
								type="checkbox"
								name="is_customisable"
								defaultChecked={product.is_customisable === 1}
								className="accent-accent"
							/>
							Customisable
						</label>
						<label className="flex items-center gap-2 text-sm text-bark cursor-pointer">
							<input
								type="checkbox"
								name="is_new"
								defaultChecked={product.is_new === 1}
								className="accent-accent"
							/>
							Mark as New
						</label>
						<label className="flex items-center gap-2 text-sm text-bark cursor-pointer">
							<input
								type="checkbox"
								name="is_active"
								defaultChecked={product.is_active === 1}
								className="accent-accent"
							/>
							Active (visible on site)
						</label>
					</div>

					<div className="flex gap-4 pt-2">
						<button
							type="submit"
							disabled={isSubmitting}
							className="bg-accent text-white px-8 py-2.5 text-sm tracking-wider uppercase hover:bg-bark transition-colors cursor-pointer border-0 disabled:opacity-50"
						>
							{isSubmitting ? "Saving…" : "Save Changes"}
						</button>
						<a
							href="/admin/products"
							className="px-8 py-2.5 text-sm tracking-wider uppercase border border-bark-mid text-bark-mid hover:bg-bark-mid hover:text-cream transition-colors no-underline"
						>
							Cancel
						</a>
					</div>
				</Form>

				<style>{`
          .field {
            width: 100%;
            border: 1px solid #d4b896;
            background: white;
            color: #2C1F14;
            padding: 0.6rem 0.85rem;
            font-family: 'Jost', sans-serif;
            font-size: 0.88rem;
            outline: none;
            border-radius: 2px;
            transition: border-color 0.2s;
          }
          .field:focus { border-color: #C8A97A; }
        `}</style>
			</div>
		</AdminLayout>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label className="block text-[0.72rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
				{label}
			</label>
			{children}
		</div>
	);
}
