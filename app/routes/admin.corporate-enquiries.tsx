import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import * as React from "react";
import AdminLayout from "~/components/_layout/admin";
import { pool } from "~/db.server";
import { sendCorporateQuoteEmail } from "~/email.server";

const statusColors: Record<string, string> = {
	new: "bg-yellow-100 text-yellow-700",
	quoted: "bg-blue-100 text-blue-700",
	deposit_paid: "bg-purple-100 text-purple-700",
	in_production: "bg-orange-100 text-orange-700",
	delivered: "bg-green-100 text-green-700",
	cancelled: "bg-red-100 text-red-700",
};

export async function loader() {
	const [enquiries] = (await pool.query(
		"SELECT * FROM corporate_enquiries ORDER BY created_at DESC",
	)) as any;

	return json({ enquiries });
}

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();
	const _action = form.get("_action") as string;
	const enquiryId = form.get("enquiryId") as string;

	if (_action === "update_status") {
		const status = form.get("status");
		await pool.query("UPDATE corporate_enquiries SET status = ? WHERE id = ?", [
			status,
			enquiryId,
		]);
	}

	if (_action === "send_quote") {
		const budget = parseFloat(form.get("budget") as string);
		const notes = form.get("notes") as string;

		await pool.query(
			"UPDATE corporate_enquiries SET budget = ?, status = 'quoted' WHERE id = ?",
			[budget, enquiryId],
		);

		const [[enquiry]] = (await pool.query(
			"SELECT * FROM corporate_enquiries WHERE id = ?",
			[enquiryId],
		)) as any;

		try {
			await sendCorporateQuoteEmail({
				id: enquiry.id,
				contactName: enquiry.contact_name,
				contactEmail: enquiry.contact_email,
				companyName: enquiry.company_name,
				quotedBudget: budget,
				notes: notes || null,
			});
		} catch (e) {
			console.error("Failed to send corporate quote email:", e);
		}
	}

	return json({ ok: true });
}

export default function AdminCorporateEnquiries() {
	const { enquiries } = useLoaderData<typeof loader>();

	return (
		<AdminLayout>
			<div className="flex items-center justify-between mb-8">
				<h1 className="font-display font-light text-3xl text-bark">
					Corporate Enquiries
				</h1>
				<span className="text-sm text-bark-mid">
					{(enquiries as any[]).length} total
				</span>
			</div>

			<div className="space-y-4">
				{(enquiries as any[]).map((enquiry) => (
					<EnquiryCard key={enquiry.id} enquiry={enquiry} />
				))}

				{(enquiries as any[]).length === 0 && (
					<div className="bg-white border border-tan/30 rounded p-12 text-center text-bark-mid text-sm">
						No corporate enquiries yet.
					</div>
				)}
			</div>
		</AdminLayout>
	);
}

function EnquiryCard({ enquiry }: { enquiry: any }) {
	const [expanded, setExpanded] = React.useState(false);

	return (
		<div className="bg-white border border-tan/30 rounded overflow-hidden">
			<div
				onClick={() => setExpanded((e) => !e)}
				className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-cream/30 transition-colors"
			>
				<div className="flex items-center gap-4">
					<span className="font-medium text-bark">#{enquiry.id}</span>
					<span className="text-sm font-medium text-bark">
						{enquiry.company_name}
					</span>
					<span className="text-sm text-bark-mid">{enquiry.contact_name}</span>
				</div>
				<div className="flex items-center gap-4">
					<span className="text-sm text-bark-mid">Qty: {enquiry.quantity}</span>
					{enquiry.budget && (
						<span className="text-sm font-medium text-bark">
							R {Number(enquiry.budget).toLocaleString("en-ZA")}
						</span>
					)}
					<span
						className={`text-[0.7rem] px-2 py-0.5 rounded uppercase tracking-wide ${
							statusColors[enquiry.status] ?? "bg-gray-100 text-gray-500"
						}`}
					>
						{enquiry.status.replace("_", " ")}
					</span>
				</div>
			</div>

			{expanded && (
				<div className="border-t border-tan/20 px-5 py-5 bg-cream/10">
					<div className="grid md:grid-cols-3 gap-6 mb-6">
						<div>
							<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
								Contact
							</p>
							<p className="text-sm text-bark">{enquiry.contact_email}</p>
							<p className="text-sm text-bark">
								{enquiry.contact_phone ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
								Order Details
							</p>
							<p className="text-sm text-bark">Quantity: {enquiry.quantity}</p>
							<p className="text-sm text-bark">
								Style: {enquiry.bag_style ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
								Branding Notes
							</p>
							<p className="text-sm text-bark-mid leading-relaxed">
								{enquiry.branding_notes ?? "—"}
							</p>
						</div>
					</div>

					<div className="border-t border-tan/20 pt-5 grid md:grid-cols-2 gap-6">
						<Form method="post" className="space-y-3">
							<input type="hidden" name="_action" value="send_quote" />
							<input type="hidden" name="enquiryId" value={enquiry.id} />
							<div>
								<label className="block text-[0.68rem] tracking-[0.1em] uppercase text-bark-mid mb-1">
									Quoted Total (R)
								</label>
								<input
									name="budget"
									type="number"
									step="0.01"
									defaultValue={enquiry.budget ?? ""}
									required
									className="w-full bg-cream border border-tan/40 px-3 py-2 text-sm outline-none focus:border-tan"
								/>
							</div>
							<div>
								<label className="block text-[0.68rem] tracking-[0.1em] uppercase text-bark-mid mb-1">
									Notes (optional, included in email)
								</label>
								<textarea
									name="notes"
									rows={2}
									className="w-full bg-cream border border-tan/40 px-3 py-2 text-sm outline-none focus:border-tan resize-y"
								/>
							</div>
							<button
								type="submit"
								className="bg-accent text-cream px-5 py-2 text-[0.72rem] uppercase tracking-wide hover:bg-bark transition-colors cursor-pointer border-0"
							>
								Send Quote Email
							</button>
						</Form>

						<Form method="post" className="flex items-end gap-3">
							<input type="hidden" name="_action" value="update_status" />
							<input type="hidden" name="enquiryId" value={enquiry.id} />
							<div className="flex-1">
								<label className="block text-[0.68rem] tracking-[0.1em] uppercase text-bark-mid mb-1">
									Status
								</label>
								<select
									name="status"
									defaultValue={enquiry.status}
									onChange={(e) => e.currentTarget.form?.requestSubmit()}
									className="w-full bg-cream border border-tan/40 px-3 py-2 text-sm outline-none focus:border-tan"
								>
									{Object.keys(statusColors).map((s) => (
										<option key={s} value={s}>
											{s.replace("_", " ")}
										</option>
									))}
								</select>
							</div>
						</Form>
					</div>
				</div>
			)}
		</div>
	);
}
