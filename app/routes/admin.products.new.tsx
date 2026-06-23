import {
	json,
	redirect,
	unstable_createFileUploadHandler,
	unstable_parseMultipartFormData,
	unstable_createMemoryUploadHandler,
	unstable_composeUploadHandlers,
} from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import {
	Form,
	useLoaderData,
	useActionData,
	useNavigation,
} from "@remix-run/react";
import path from "path";
import AdminLayout from "~/components/_layout/admin";
import { pool } from "~/db.server";

export async function loader() {
	const [categories] = await pool.query(
		"SELECT id, name FROM categories ORDER BY name",
	);
	const [leatherTypes] = await pool.query(
		"SELECT id, name, is_vegan FROM leather_types",
	);
	return json({ categories, leatherTypes });
}

export async function action({ request }: ActionFunctionArgs) {
	const uploadHandler = unstable_composeUploadHandlers(
		// Handle file fields — save to disk
		unstable_createFileUploadHandler({
			directory: path.join(process.cwd(), "public/images/products"),
			maxPartSize: 5_000_000,
			file: ({ filename }) => filename,
		}),
		// Handle all text fields — keep in memory
		unstable_createMemoryUploadHandler(),
	);

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
	const is_customisable = form.get("is_customisable") === "on" ? 1 : 0;
	const is_new = form.get("is_new") === "on" ? 1 : 0;
	const image = form.get("image") as any;

	if (!name || !category_id || isNaN(base_price)) {
		return json(
			{ error: "Name, category and price are required." },
			{ status: 400 },
		);
	}

	// Insert product
	const [result] = (await pool.query(
		`INSERT INTO products
      (slug, name, category_id, leather_type_id, base_price, description, care_instructions, is_customisable, is_new)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			slug,
			name,
			category_id,
			leather_type_id,
			base_price,
			description,
			care,
			is_customisable,
			is_new,
		],
	)) as any;

	// If an image was uploaded, save it to product_images
	if (image?.name) {
		const imageUrl = `/images/products/${image.name}`;
		await pool.query(
			"INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, 0)",
			[result.insertId, imageUrl, name],
		);
	}

	return redirect("/admin/products");
}

export default function NewProduct() {
	const { categories, leatherTypes } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";

	return (
		<AdminLayout>
			<div className="max-w-2xl">
				<div className="mb-8">
					<h1 className="font-display font-light text-3xl text-bark">
						Add Product
					</h1>
					<p className="text-sm text-bark-mid mt-1">
						Fill in the details to add a new product.
					</p>
				</div>

				{actionData?.error && (
					<div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
						{actionData.error}
					</div>
				)}

				{/* encType is required for file uploads */}
				<Form method="post" encType="multipart/form-data" className="space-y-6">
					<Field label="Product Name *">
						<input
							name="name"
							type="text"
							required
							placeholder="e.g. The Nomad Tote"
							className="field"
						/>
					</Field>

					<Field label="Category *">
						<select name="category_id" required className="field">
							<option value="">Select a category…</option>
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
							placeholder="1250.00"
							className="field"
						/>
					</Field>

					<Field label="Leather Type">
						<select name="leather_type_id" className="field">
							<option value="">Select leather type…</option>
							{(leatherTypes as any[]).map((l) => (
								<option key={l.id} value={l.id}>
									{l.name} {l.is_vegan ? "(Vegan)" : ""}
								</option>
							))}
						</select>
					</Field>

					<Field label="Description">
						<textarea
							name="description"
							rows={4}
							className="field resize-y"
							placeholder="Describe the product…"
						/>
					</Field>

					<Field label="Care Instructions">
						<textarea
							name="care_instructions"
							rows={3}
							className="field resize-y"
							placeholder="e.g. Wipe clean with a dry cloth…"
						/>
					</Field>

					{/* Image upload */}
					<Field label="Product Image">
						<div className="border-2 border-dashed border-tan/40 rounded p-6 text-center hover:border-tan transition-colors">
							<i className="ti ti-upload text-3xl text-tan-dark block mb-2" />
							<input
								type="file"
								name="image"
								accept="image/jpeg,image/png,image/webp"
								className="w-full text-sm text-bark-mid cursor-pointer"
							/>
							<p className="text-[0.72rem] text-bark-mid mt-2">
								JPG, PNG or WebP — max 5MB
							</p>
						</div>
					</Field>

					<div className="flex gap-8">
						<label className="flex items-center gap-2 text-sm text-bark cursor-pointer">
							<input
								type="checkbox"
								name="is_customisable"
								defaultChecked
								className="accent-accent"
							/>
							Customisable
						</label>
						<label className="flex items-center gap-2 text-sm text-bark cursor-pointer">
							<input type="checkbox" name="is_new" className="accent-accent" />
							Mark as New
						</label>
					</div>

					<div className="flex gap-4 pt-2">
						<button
							type="submit"
							disabled={isSubmitting}
							className="bg-accent text-white px-8 py-2.5 text-sm tracking-wider uppercase hover:bg-bark transition-colors cursor-pointer border-0 disabled:opacity-50"
						>
							{isSubmitting ? "Saving…" : "Save Product"}
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
