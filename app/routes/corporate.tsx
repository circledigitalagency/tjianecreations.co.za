import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";
import { sendCorporateEnquiryNotification } from "~/email.server";

export const meta: MetaFunction = () => [
	{ title: "Corporate Gifting — Tjiane Creations" },
	{
		name: "description",
		content:
			"Branded leather bags for corporate events, staff rewards, and client gifts. Bulk pricing available.",
	},
];

// ✅ Typed action result
type ActionResult =
	| { success: true; enquiryId: number }
	| { success: false; error: string };

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();

	const company_name = form.get("company_name") as string;
	const contact_name = form.get("contact_name") as string;
	const contact_email = form.get("contact_email") as string;
	const contact_phone = form.get("contact_phone") as string;
	const quantity = parseInt(form.get("quantity") as string);
	const bag_style = form.get("bag_style") as string;
	const branding_notes = form.get("branding_notes") as string;

	if (!company_name || !contact_name || !contact_email || !quantity) {
		return json<ActionResult>(
			{
				success: false,
				error: "Please fill in company name, contact details and quantity.",
			},
			{ status: 400 },
		);
	}

	const [result] = (await pool.query(
		`INSERT INTO corporate_enquiries
      (company_name, contact_name, contact_email, contact_phone, quantity, bag_style, branding_notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'new')`,
		[
			company_name,
			contact_name,
			contact_email,
			contact_phone,
			quantity,
			bag_style || null,
			branding_notes || null,
		],
	)) as any;

	const enquiryId = result.insertId;

	try {
		await sendCorporateEnquiryNotification({
			id: enquiryId,
			companyName: company_name,
			contactName: contact_name,
			contactEmail: contact_email,
			contactPhone: contact_phone,
			quantity,
			bagStyle: bag_style || null,
			brandingNotes: branding_notes || null,
		});
	} catch (e) {
		console.error("Failed to send corporate enquiry notification:", e);
	}

	return json<ActionResult>({ success: true, enquiryId });
}

const bagStyleOptions = [
	"Tote Bag",
	"Clutch Bag",
	"Crossbody",
	"Backpack",
	"Keychain",
	"Mixed / Not sure yet",
];

const perks = [
	{ title: "Bulk Pricing", desc: "Reduced rates for orders of 10+" },
	{ title: "Logo Stamping", desc: "Company name or logo in leather" },
	{ title: "Custom Branding", desc: "Colours to match your identity" },
	{ title: "Gift Packaging", desc: "Presentation-ready delivery" },
];

export default function Corporate() {
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";

	const success = actionData && "success" in actionData && actionData.success;
	const errorMessage =
		actionData && "success" in actionData && !actionData.success
			? actionData.error
			: null;

	if (success) {
		return (
			<MainLayout>
				<div className="px-16 py-32 max-w-xl mx-auto text-center">
					<div className="text-5xl mb-6">✓</div>
					<h1 className="font-display font-light text-3xl text-bark mb-4">
						Enquiry Received
					</h1>
					<p className="text-bark-mid font-light leading-relaxed mb-2">
						Thank you! Your corporate gifting enquiry #{actionData.enquiryId}{" "}
						has been submitted.
					</p>
					<p className="text-bark-mid font-light leading-relaxed mb-8">
						We'll be in touch with a quote within 24–48 hours.
					</p>
					<Link
						to="/"
						className="bg-accent text-cream px-9 py-3 text-[0.8rem] tracking-[0.12em] uppercase no-underline hover:bg-bark transition-colors inline-block"
					>
						Back to Home
					</Link>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			{/* Hero + Image */}
			<div className="bg-cream-white px-16 py-20 border-b border-tan/20">
				<div className="grid md:grid-cols-2 gap-16 items-center">
					{/* Pitch */}
					<div>
						<span className="text-eyebrow text-tan-dark block mb-3">
							For Corporate Clients
						</span>
						<h1 className="font-display font-light text-[clamp(2.5rem,4vw,4.5rem)] leading-[1.15] text-bark mb-6">
							Branded gifts
							<br />
							they'll <em className="italic text-accent">actually</em> use.
						</h1>
						<p className="text-[0.93rem] leading-[1.9] text-bark-mid font-light max-w-[480px] mb-8">
							Elevate your next event, staff reward, or client gift with a
							handcrafted leather bag bearing your logo or message. Minimum
							quantities apply — get in touch to discuss your brief.
						</p>

						{/* Perks as a compact inline list */}
						<div className="grid grid-cols-2 gap-4">
							{perks.map(({ title, desc }) => (
								<div key={title} className="border-l-2 border-tan pl-3">
									<div className="font-display font-semibold text-[0.9rem] text-bark mb-0.5">
										{title}
									</div>
									<div className="text-[0.75rem] text-bark-mid leading-[1.5]">
										{desc}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Visual */}
					<div className="aspect-square bg-gradient-to-br from-cream to-tan-light flex items-center justify-center text-[5rem] opacity-35 relative overflow-hidden">
						💼
						<span className="absolute bottom-8 right-8 font-display italic text-[1.2rem] text-bark-mid opacity-60">
							For Business
						</span>
					</div>
				</div>
			</div>

			{/* Process + Form combined as a grid */}
			<section className="px-16 py-20 bg-cream-white border-t border-tan/20">
				<div className="grid md:grid-cols-2 gap-20 items-start">
					{/* Process explainer */}
					<div>
						<h2 className="font-display font-light text-[2rem] text-bark mb-6">
							The corporate process
						</h2>
						<div className="space-y-6">
							{[
								{
									step: "01",
									heading: "Brief us",
									body: "Tell us your order size, branding details, and preferred bag style. We'll confirm feasibility within 24 hours.",
								},
								{
									step: "02",
									heading: "Approve the sample",
									body: "We produce a single branded sample for your sign-off before running the full order.",
								},
								{
									step: "03",
									heading: "Receive and impress",
									body: "Orders are packaged individually, ready for gifting. We can deliver to your office or directly to recipients.",
								},
							].map(({ step, heading, body }) => (
								<div key={step} className="flex gap-6">
									<span className="font-display font-light text-[1.8rem] text-tan-dark leading-none shrink-0 w-10">
										{step}
									</span>
									<div>
										<div className="font-body font-medium text-tan-dark mb-1">
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

					{/* Enquiry form */}
					<div className="bg-bark/5 border border-tan/25 p-8">
						<p className="text-[0.7rem] tracking-[0.2em] uppercase text-tan-dark mb-2">
							Request a Quote
						</p>
						<p className="text-[0.85rem] text-bark-mid font-light mb-6">
							Tell us about your event or gifting brief and we'll get back to
							you with pricing.
						</p>

						{errorMessage && (
							<div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
								{errorMessage}
							</div>
						)}

						<Form method="post" className="space-y-5">
							<div className="grid grid-cols-2 gap-4">
								<FormRow label="Company Name *">
									<input
										name="company_name"
										type="text"
										required
										className="form-field"
									/>
								</FormRow>
								<FormRow label="Contact Name *">
									<input
										name="contact_name"
										type="text"
										required
										className="form-field"
									/>
								</FormRow>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormRow label="Email *">
									<input
										name="contact_email"
										type="email"
										required
										className="form-field"
									/>
								</FormRow>
								<FormRow label="Phone">
									<input
										name="contact_phone"
										type="tel"
										placeholder="+27 82 000 0000"
										className="form-field"
									/>
								</FormRow>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormRow label="Quantity Needed *">
									<input
										name="quantity"
										type="number"
										min="1"
										required
										placeholder="e.g. 25"
										className="form-field"
									/>
								</FormRow>
								<FormRow label="Preferred Bag Style">
									<select name="bag_style" className="form-field">
										<option value="">Select a style…</option>
										{bagStyleOptions.map((s) => (
											<option key={s}>{s}</option>
										))}
									</select>
								</FormRow>
							</div>

							<FormRow label="Branding Notes">
								<textarea
									name="branding_notes"
									rows={3}
									placeholder="Tell us about your logo, colours, deadline, or any other details…"
									className="form-field resize-y"
								/>
							</FormRow>

							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full bg-accent text-cream py-[0.9rem] text-[0.78rem] tracking-[0.15em] uppercase font-medium hover:bg-bark transition-colors cursor-pointer border-0 disabled:opacity-50"
							>
								{isSubmitting ? "Submitting…" : "Submit Enquiry"}
							</button>
						</Form>
					</div>
				</div>
			</section>

			<style>{`
        .form-field {
          width: 100%;
          background: white;
          border: 1px solid rgba(200,169,122,0.4);
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
