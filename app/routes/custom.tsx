import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useState } from "react";
import {
	Form,
	useActionData,
	useLoaderData,
	useNavigation,
} from "@remix-run/react";
import fs from "fs";
import path from "path";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";
import { sendCustomOrderNotification } from "~/email.server";

export const meta: MetaFunction = () => [
	{ title: "Custom Orders — Tjiane Creations" },
	{
		name: "description",
		content:
			"Order a handcrafted leather piece made exactly to your specifications.",
	},
];

const ITEM_FOLDERS = [
	{ label: "Book Cover (A5)", folder: "book-cover" },
	{ label: "Laptop Sleeve", folder: "laptop-sleeve" },
	{ label: "Bookmark", folder: "bookmark" },
	{ label: "Baby Shoes", folder: "baby-shoes" },
	{ label: "Key Holder (Africa Map)", folder: "key-holder" },
	{ label: "Bible Cover / Bag", folder: "bible-cover" },
	{ label: "Belt", folder: "belt" },
	{ label: "Something else (my own item)", folder: "other" },
];

type ActionResult =
	| { success: true; orderId: number }
	| { success: false; error: string };

export async function loader() {
	const [leatherTypes] = (await pool.query(
		"SELECT id, name, is_vegan FROM leather_types",
	)) as any;
	const [colours] = (await pool.query(
		"SELECT id, name, hex_value FROM colours",
	)) as any;

	const galleryByType: Record<string, string[]> = {};
	const galleryBase = path.join(process.cwd(), "public/images/custom-examples");

	for (const { folder } of ITEM_FOLDERS) {
		const dir = path.join(galleryBase, folder);
		try {
			galleryByType[folder] = fs
				.readdirSync(dir)
				.filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
				.map((f) => `/images/custom-examples/${folder}/${f}`);
		} catch {
			galleryByType[folder] = [];
		}
	}

	return json({ leatherTypes, colours, galleryByType });
}

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();

	const customer_name = form.get("customer_name") as string;
	const customer_email = form.get("customer_email") as string;
	const customer_phone = form.get("customer_phone") as string;
	const bag_style = form.get("bag_style") as string;
	const item_size = (form.get("item_size") as string)?.trim() || null;
	const own_item = form.get("own_item") === "1" ? 1 : 0;
	const extras = form.getAll("extras").join(", ") || null;
	const leather_type_id = form.get("leather_type_id") || null;
	const colour_id = form.get("colour_id") || null;
	const monogram_text = form.get("monogram_text") as string;
	const font_preference = form.get("font_preference") as string;
	const special_instructions = form.get("special_instructions") as string;

	if (!customer_name || !customer_email || !bag_style) {
		return json<ActionResult>(
			{
				success: false,
				error: "Please fill in your name, email and item type.",
			},
			{ status: 400 },
		);
	}

	const [existing] = (await pool.query(
		"SELECT id FROM customers WHERE email = ?",
		[customer_email],
	)) as any;

	let customerId: number;
	if ((existing as any[]).length > 0) {
		customerId = existing[0].id;
	} else {
		const [result] = (await pool.query(
			"INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
			[customer_name, customer_email, customer_phone],
		)) as any;
		customerId = result.insertId;
	}

	const [result] = (await pool.query(
		`INSERT INTO custom_orders
      (customer_id, customer_name, customer_email, customer_phone, bag_style,
       item_size, own_item, extras,
       leather_type_id, colour_id, monogram_text, font_preference, special_instructions, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
		[
			customerId,
			customer_name,
			customer_email,
			customer_phone,
			bag_style,
			item_size,
			own_item,
			extras,
			leather_type_id,
			colour_id,
			monogram_text,
			font_preference,
			special_instructions,
		],
	)) as any;

	const orderId = result.insertId;

	try {
		await sendCustomOrderNotification({
			id: orderId,
			customerName: customer_name,
			customerEmail: customer_email,
			customerPhone: customer_phone,
			bagStyle: bag_style,
			monogramText: monogram_text || null,
			specialInstructions: special_instructions || null,
		});
	} catch (e) {
		console.error("Failed to send notification:", e);
	}

	return json<ActionResult>({ success: true, orderId });
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ITEM_TYPES: { value: string; price: string | null; note?: string }[] = [
	{
		value: "Book Cover (A5)",
		price: "from R200",
		note: "Scripture or quote engraving available",
	},
	{ value: "Laptop Sleeve", price: "from R700" },
	{ value: "Bookmark", price: "from R75" },
	{ value: "Baby Shoes", price: "from R150" },
	{ value: "Key Holder (Africa Map)", price: "from R80" },
	{
		value: "Bible Cover / Bag",
		price: null,
		note: "Customised per size — priced on quote",
	},
	{ value: "Belt", price: null },
	{
		value: "Something else (my own item)",
		price: null,
		note: "We'll work on the artwork with you and quote",
	},
];

const SIZED_ITEMS = ["Laptop Sleeve", "Bible Cover / Bag", "Belt"];

const SIZE_PLACEHOLDERS: Record<string, string> = {
	"Laptop Sleeve": "e.g. 13-inch, 15.6-inch",
	"Bible Cover / Bag": "e.g. the Bible's measurements (L × W × thickness)",
	Belt: "e.g. waist size 34",
};

const EXTRAS_OPTIONS = [
	"Africa map emblem",
	"Name / initials engraving",
	"Scripture or quote engraving",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Custom() {
	const { leatherTypes, colours, galleryByType } =
		useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";

	const [selectedItem, setSelectedItem] = useState<string>("");
	const [selectedColour, setSelectedColour] = useState<number | null>(null);
	const [selectedFont, setSelectedFont] = useState<string>("Classic Serif");
	const [lightboxImage, setLightboxImage] = useState<string | null>(null);

	const ownItem = selectedItem === "Something else (my own item)";
	const showSizeField = SIZED_ITEMS.includes(selectedItem);
	const selectedItemConfig = ITEM_TYPES.find((t) => t.value === selectedItem);

	const success = actionData && "success" in actionData && actionData.success;
	const errorMessage =
		actionData && "success" in actionData && !actionData.success
			? actionData.error
			: null;

	const ITEM_FOLDER_MAP: Record<string, string> = Object.fromEntries(
		ITEM_FOLDERS.map(({ label, folder }) => [label, folder]),
	);

	const currentFolder = ITEM_FOLDER_MAP[selectedItem] ?? null;
	const currentImages: string[] = currentFolder
		? (galleryByType as Record<string, string[]>)[currentFolder] ?? []
		: Object.values(galleryByType as Record<string, string[]>).flat();

	if (success) {
		return (
			<MainLayout>
				<div className="px-16 py-32 max-w-xl mx-auto text-center">
					<div className="text-5xl mb-6">✓</div>
					<h1 className="font-display font-light text-3xl text-bark mb-4">
						Request Received
					</h1>
					<p className="text-bark-mid font-light leading-relaxed mb-2">
						Thank you! Your custom order #{actionData.orderId} has been
						submitted.
					</p>
					<p className="text-bark-mid font-light leading-relaxed">
						We'll review the details and send you a final quote with a deposit
						link within 24–48 hours.
					</p>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			{/* Gallery + Form */}
			<div className="px-8 md:px-16 py-16">
				<div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
					{/* LEFT — gallery */}
					<div className="sticky top-24">
						<span className="text-eyebrow text-tan-dark block mb-2">
							{selectedItem
								? `${selectedItem} — Past Work`
								: "Past Custom Work"}
						</span>
						<h2 className="font-display font-light text-[1.8rem] text-bark mb-6">
							{selectedItem ? (
								<>
									<em className="italic text-accent">Examples</em> of this item
								</>
							) : (
								<>
									Made for people{" "}
									<em className="italic text-accent">like you</em>
								</>
							)}
						</h2>

						{currentImages.length > 0 ? (
							<div className="overflow-y-auto max-h-[520px] pr-1">
								<div className="grid grid-cols-2 gap-3">
									{currentImages.map((src, i) => (
										<button
											key={src}
											type="button"
											onClick={() => setLightboxImage(src)}
											className="overflow-hidden border-0 p-0 cursor-pointer bg-transparent group aspect-square"
										>
											<img
												src={src}
												alt={`${selectedItem || "Custom"} example ${i + 1}`}
												loading="lazy"
												className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
											/>
										</button>
									))}
								</div>
							</div>
						) : (
							<div className="border border-tan/30 bg-cream-white p-10 text-center">
								<p className="font-display italic text-lg text-bark-mid mb-2">
									{selectedItem
										? `No ${selectedItem} photos yet`
										: "Gallery coming soon"}
								</p>
								<p className="text-[0.8rem] text-bark-mid font-light">
									{selectedItem
										? "Select another item to see examples, or describe what you want in the form."
										: "Photos of past custom pieces will appear here."}
								</p>
							</div>
						)}

						{/* How it works */}
						<div className="mt-8 grid grid-cols-2 gap-3">
							{[
								{ n: "01", text: "Submit this form" },
								{ n: "02", text: "Receive your final quote" },
								{ n: "03", text: "Pay 50% deposit" },
								{ n: "04", text: "Delivered in 7–14 days" },
							].map(({ n, text }) => (
								<div key={n} className="flex items-center gap-2">
									<span className="font-display font-light text-lg text-tan-dark w-6 shrink-0">
										{n}
									</span>
									<span className="text-[0.75rem] text-bark-mid">{text}</span>
								</div>
							))}
						</div>
					</div>

					{/* RIGHT — form */}
					<div className="bg-bark/5 border border-tan/25 p-8">
						<p className="text-[0.7rem] tracking-[0.2em] uppercase text-tan-dark mb-6">
							Your Details
						</p>

						{errorMessage && (
							<div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
								{errorMessage}
							</div>
						)}

						<Form method="post" className="space-y-5">
							<input
								type="hidden"
								name="colour_id"
								value={selectedColour ?? ""}
							/>
							<input
								type="hidden"
								name="font_preference"
								value={selectedFont}
							/>
							<input
								type="hidden"
								name="own_item"
								value={ownItem ? "1" : "0"}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormRow label="Full Name *">
									<input
										name="customer_name"
										type="text"
										required
										className="form-field"
										placeholder="Your name"
									/>
								</FormRow>
								<FormRow label="Email *">
									<input
										name="customer_email"
										type="email"
										required
										className="form-field"
										placeholder="example@.com"
									/>
								</FormRow>
							</div>

							<FormRow label="Phone Number">
								<input
									name="customer_phone"
									type="tel"
									placeholder="+27 82 000 0000"
									className="form-field"
								/>
							</FormRow>

							<FormRow label="Item Type *">
								<select
									name="bag_style"
									required
									className="form-field"
									value={selectedItem}
									onChange={(e) => setSelectedItem(e.target.value)}
								>
									<option value="">Select an item…</option>
									{ITEM_TYPES.map((t) => (
										<option key={t.value} value={t.value}>
											{t.value}
											{t.price ? ` — ${t.price}` : ""}
										</option>
									))}
								</select>
								{selectedItemConfig?.note && (
									<p className="text-[0.72rem] text-tan-dark mt-1">
										{selectedItemConfig.note}
									</p>
								)}
							</FormRow>

							{/* Size — only for sized items */}
							{showSizeField && (
								<FormRow label="Size *">
									<input
										name="item_size"
										type="text"
										required
										placeholder={
											SIZE_PLACEHOLDERS[selectedItem] ??
											"e.g. dimensions or size"
										}
										className="form-field"
									/>
								</FormRow>
							)}

							<FormRow label="Leather Type">
								<select name="leather_type_id" className="form-field">
									<option value="">Select leather type…</option>
									{(leatherTypes as any[]).map((l) => (
										<option key={l.id} value={l.id}>
											{l.name} {l.is_vegan ? "(Vegan)" : ""}
										</option>
									))}
								</select>
							</FormRow>

							<FormRow label="Leather Colour">
								<div className="flex gap-3 flex-wrap mt-1">
									{(colours as any[]).map((c) => (
										<button
											key={c.id}
											type="button"
											onClick={() => setSelectedColour(c.id)}
											title={c.name}
											style={{ backgroundColor: c.hex_value }}
											className={`w-7 h-7 rounded-full cursor-pointer transition-all duration-150 hover:scale-110 border-0 ${
												selectedColour === c.id
													? "ring-2 ring-offset-2 ring-tan scale-110"
													: ""
											}`}
										/>
									))}
								</div>
							</FormRow>

							<FormRow label="Personalisation Extras">
								<div className="flex flex-col gap-2 mt-1">
									{EXTRAS_OPTIONS.map((extra) => (
										<label
											key={extra}
											className="flex items-center gap-2 text-sm text-bark cursor-pointer"
										>
											<input
												type="checkbox"
												name="extras"
												value={extra}
												className="accent-accent"
											/>
											{extra}
										</label>
									))}
								</div>
							</FormRow>

							<FormRow label="Text / Initials / Quote to stamp">
								<input
									name="monogram_text"
									type="text"
									placeholder="e.g. TNK, With Love Mom, or a scripture"
									maxLength={100}
									className="form-field"
								/>
							</FormRow>

							<FormRow label="Special Instructions">
								<textarea
									name="special_instructions"
									placeholder="Describe your item, artwork ideas, delivery date, gift message…"
									rows={3}
									className="form-field resize-y"
								/>
							</FormRow>

							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full bg-accent text-cream py-[0.9rem] text-[0.78rem] tracking-[0.15em] uppercase font-medium hover:bg-bark transition-colors cursor-pointer border-0 disabled:opacity-50"
							>
								{isSubmitting ? "Submitting…" : "Submit Custom Order Request"}
							</button>

							<p className="text-[0.68rem] text-bark-mid text-center">
								Listed prices are starting prices. We'll confirm your final
								quote before any payment is taken.
							</p>
						</Form>
					</div>
				</div>
			</div>

			{/* Lightbox */}
			{lightboxImage && (
				<div
					onClick={() => setLightboxImage(null)}
					className="fixed inset-0 z-[100] bg-bark/90 flex items-center justify-center p-8 cursor-pointer"
				>
					<img
						src={lightboxImage}
						alt="Custom work example"
						className="max-w-full max-h-full object-contain"
					/>
					<button
						onClick={() => setLightboxImage(null)}
						className="absolute top-6 right-6 text-cream text-3xl bg-transparent border-0 cursor-pointer"
						aria-label="Close"
					>
						×
					</button>
				</div>
			)}

			<style>{`
        .form-field {
          width: 100%;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(200,169,122,0.4);
          color: #2C1F14;
          padding: 0.65rem 0.9rem;
          font-family: 'Jost', sans-serif;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
          appearance: auto;
        }
        .form-field:focus { border-color: #C8A97A; }
      `}</style>
		</MainLayout>
	);
}

function FormRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
				{label}
			</label>
			{children}
		</div>
	);
}
