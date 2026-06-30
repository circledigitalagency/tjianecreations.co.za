import type {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useState } from "react";
import {
	Form,
	useActionData,
	useLoaderData,
	useNavigation,
} from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";
import { sendCustomOrderNotification } from "~/email.server";

export const meta: MetaFunction = () => [
	{ title: "Custom Orders — Tjiane Creations" },
	{
		name: "description",
		content:
			"Order a handcrafted leather bag made exactly to your specifications.",
	},
];

export async function loader() {
	const [leatherTypes] = (await pool.query(
		"SELECT id, name, is_vegan FROM leather_types",
	)) as any;
	const [colours] = (await pool.query(
		"SELECT id, name, hex_value FROM colours",
	)) as any;

	return json({ leatherTypes, colours });
}

const bagStyles = [
	"Tote Bag",
	"Clutch Bag",
	"Crossbody",
	"Backpack",
	"Keychain",
	"Hat",
	"Diary",
];
const fontOptions = ["Classic Serif", "Script / Cursive", "Block Capitals"];

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();

	const customer_name = form.get("customer_name") as string;
	const customer_email = form.get("customer_email") as string;
	const customer_phone = form.get("customer_phone") as string;
	const bag_style = form.get("bag_style") as string;
	const leather_type_id = form.get("leather_type_id") || null;
	const colour_id = form.get("colour_id") || null;
	const monogram_text = form.get("monogram_text") as string;
	const font_preference = form.get("font_preference") as string;
	const special_instructions = form.get("special_instructions") as string;

	if (!customer_name || !customer_email || !bag_style) {
		return json<ActionResult>(
			{
				success: false,
				error: "Please fill in your name, email and bag style.",
			},
			{ status: 400 },
		);
	}

	// Find or create customer
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
       leather_type_id, colour_id, monogram_text, font_preference, special_instructions, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
		[
			customerId,
			customer_name,
			customer_email,
			customer_phone,
			bag_style,
			leather_type_id,
			colour_id,
			monogram_text,
			font_preference,
			special_instructions,
		],
	)) as any;

	const orderId = result.insertId;

	// Notify admin via Resend
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
		console.error("Failed to send notification email:", e);
		// Don't block the order if email fails
	}

	return json<ActionResult>({ success: true, orderId });
}

type ActionResult =
	| { success: true; orderId: number }
	| { success: false; error: string };

export default function Custom() {
	const { leatherTypes, colours } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";
	const [selectedColour, setSelectedColour] = useState<number | null>(null);

	if (actionData?.success) {
		return (
			<MainLayout>
				<div className="px-16 py-32 max-w-xl mx-auto text-center">
					<div className="text-5xl mb-6">✓</div>
					<h1 className="font-display font-light text-3xl text-bark mb-4">
						Request Received
					</h1>
					<p className="text-bark-mid font-light leading-relaxed mb-2">
						Thank you! Your custom order request #{actionData.orderId} has been
						submitted.
					</p>
					<p className="text-bark-mid font-light leading-relaxed">
						We'll review the details and send you a quote with a deposit link
						within 24–48 hours.
					</p>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			{/* Hero banner */}
			<div className="bg-bark text-cream px-16 py-20">
				<div className="max-w-[680px]">
					<p className="text-[0.7rem] tracking-[0.25em] uppercase text-tan mb-4">
						Make it Yours
					</p>
					<h1 className="font-display font-light text-[clamp(2.5rem,4vw,4.5rem)] leading-[1.15] mb-6">
						A bag as <em className="italic text-tan">unique</em>
						<br />
						as you are.
					</h1>
					<p className="text-[0.93rem] leading-[1.9] text-cream-white/70 font-light">
						Tell us exactly what you want — leather, colour, monogram and
						stitching. We'll quote you and handcraft it once your deposit is
						received.
					</p>
				</div>
			</div>

			{/* Form section */}
			<div className="px-16 py-20">
				<div className="grid md:grid-cols-2 gap-20 items-start">
					{/* Process explainer */}
					<div>
						<h2 className="font-display font-light text-[2rem] text-bark mb-6">
							How it works
						</h2>
						<div className="space-y-6">
							{[
								{
									step: "01",
									heading: "Fill the form",
									body: "Describe your ideal piece — style, colour, monogram and any special details.",
								},
								{
									step: "02",
									heading: "Receive your quote",
									body: "We'll review your request and email you a quote with a deposit payment link.",
								},
								{
									step: "03",
									heading: "Pay the deposit",
									body: "A 50% deposit confirms your order and we begin crafting.",
								},
								{
									step: "04",
									heading: "Delivered to you",
									body: "Allow 7–14 business days. Final balance due before dispatch.",
								},
							].map(({ step, heading, body }) => (
								<div key={step} className="flex gap-6">
									<span className="font-display font-light text-[1.8rem] text-tan-dark leading-none shrink-0 w-10">
										{step}
									</span>
									<div>
										<div className="font-body font-medium text-bark mb-1">
											{heading}
										</div>
										<div className="text-[0.88rem] leading-[1.7] text-bark-mid font-light">
											{body}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Order form */}
					<div className="bg-bark/5 border border-tan/25 p-8">
						<p className="text-[0.7rem] tracking-[0.2em] uppercase text-tan-dark mb-6">
							Custom Order Request
						</p>

						{actionData?.error && (
							<div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
								{actionData.error}
							</div>
						)}

						<Form method="post" className="space-y-5">
							<div className="grid grid-cols-2 gap-4">
								<FormRow label="Full Name *">
									<input
										name="customer_name"
										type="text"
										required
										className="form-field"
									/>
								</FormRow>
								<FormRow label="Email *">
									<input
										name="customer_email"
										type="email"
										required
										className="form-field"
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
								<select name="bag_style" required className="form-field">
									<option value="">Select an item…</option>
									{bagStyles.map((s) => (
										<option key={s}>{s}</option>
									))}
								</select>
							</FormRow>

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

							<FormRow label="Text / Initials to stamp">
								<input
									name="monogram_text"
									type="text"
									placeholder="e.g. 'TNK' or 'With Love, Mom'"
									className="form-field"
								/>
							</FormRow>

							<FormRow label="Font preference">
								<select name="font_preference" className="form-field">
									<option value="">Select a font…</option>
									{fontOptions.map((f) => (
										<option key={f}>{f}</option>
									))}
								</select>
							</FormRow>

							<FormRow label="Leather Colour">
								<input
									type="hidden"
									name="colour_id"
									value={selectedColour ?? ""}
								/>
								<div className="flex gap-3 flex-wrap mt-1">
									{(colours as any[]).map((c) => (
										<button
											key={c.id}
											type="button"
											onClick={() => setSelectedColour(c.id)}
											title={c.name}
											style={{ backgroundColor: c.hex_value }}
											className={`w-7 h-7 rounded-full cursor-pointer transition-transform duration-200 hover:scale-110 border-0 ${
												selectedColour === c.id
													? "ring-2 ring-offset-2 ring-tan"
													: ""
											}`}
										/>
									))}
								</div>
							</FormRow>

							<FormRow label="Special Instructions">
								<textarea
									name="special_instructions"
									placeholder="Any other details — pocket placement, lining fabric, delivery date…"
									rows={3}
									className="form-field resize-y"
								/>
							</FormRow>

							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full bg-tan text-bark py-[0.9rem] text-[0.78rem] tracking-[0.15em] uppercase font-medium font-body transition-colors hover:bg-tan-light mt-2 cursor-pointer border-0 disabled:opacity-50"
							>
								{isSubmitting ? "Submitting…" : "Submit Request"}
							</button>
						</Form>
					</div>
				</div>
			</div>

			<style>{`
        .form-field {
          width: 100%;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(200,169,122,0.35);
          color: #2C1F14;
          padding: 0.7rem 0.9rem;
          font-family: 'Jost', sans-serif;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
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
