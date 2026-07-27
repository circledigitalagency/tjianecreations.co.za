import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import * as React from "react";
import AdminLayout from "~/components/_layout/admin";
import { pool } from "~/db.server";
import {
	sendCustomOrderStatusEmail,
	sendBalanceRequestEmail,
	sendDepositRequestEmail,
} from "~/email.server";

const statusColors: Record<string, string> = {
	submitted: "bg-yellow-100 text-yellow-700",
	deposit_paid: "bg-blue-100 text-blue-700",
	in_production: "bg-purple-100 text-purple-700",
	ready: "bg-orange-100 text-orange-700",
	payment_complete: "bg-teal-100 text-teal-700",
	shipped: "bg-orange-100 text-orange-700",
	complete: "bg-green-100 text-green-700",
	cancelled: "bg-red-100 text-red-700",
};

export async function loader() {
	const [orders] = (await pool.query(
		`SELECT
      co.*,
      lt.name AS leather_type_name,
      c.name  AS colour_name,
      c.hex_value AS colour_hex
    FROM custom_orders co
    LEFT JOIN leather_types lt ON co.leather_type_id = lt.id
    LEFT JOIN colours c        ON co.colour_id = c.id
    ORDER BY co.created_at DESC`,
	)) as any;

	return json({ orders });
}

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();
	const _action = form.get("_action") as string;
	const orderId = form.get("orderId") as string;

	if (_action === "update_status") {
		const status = form.get("status") as string;

		await pool.query("UPDATE custom_orders SET status = ? WHERE id = ?", [
			status,
			orderId,
		]);

		const [[order]] = (await pool.query(
			"SELECT * FROM custom_orders WHERE id = ?",
			[orderId],
		)) as any;

		// Send status email to customer
		try {
			await sendCustomOrderStatusEmail({
				id: order.id,
				customerName: order.customer_name,
				customerEmail: order.customer_email,
				bagStyle: order.bag_style,
				status,
				trackingNumber: order.tracking_number,
			});
		} catch (e) {
			console.error("Status email failed:", e);
		}

		// When marking as 'ready' — send balance payment link
		if (status === "ready") {
			const balance =
				Number(order.quoted_total) -
				Number(order.deposit_paid ?? order.deposit_amount);
			try {
				await sendBalanceRequestEmail({
					id: order.id,
					customerName: order.customer_name,
					customerEmail: order.customer_email,
					bagStyle: order.bag_style,
					balanceAmount: balance,
					paymentUrl: `${process.env.APP_URL}/custom-orders/${order.id}/balance`,
				});
			} catch (e) {
				console.error("Balance request email failed:", e);
			}
		}
	}

	if (_action === "update_tracking") {
		const tracking = form.get("tracking_number") as string;

		await pool.query(
			"UPDATE custom_orders SET tracking_number = ? WHERE id = ?",
			[tracking, orderId],
		);
	}

	if (_action === "send_quote") {
		const quotedTotal = parseFloat(form.get("quoted_total") as string);
		const depositAmount = parseFloat(form.get("deposit_amount") as string);

		await pool.query(
			"UPDATE custom_orders SET quoted_total = ?, deposit_amount = ?, status = 'submitted' WHERE id = ?",
			[quotedTotal, depositAmount, orderId],
		);

		const [[order]] = (await pool.query(
			"SELECT * FROM custom_orders WHERE id = ?",
			[orderId],
		)) as any;

		try {
			await sendDepositRequestEmail({
				id: order.id,
				customerName: order.customer_name,
				customerEmail: order.customer_email,
				depositAmount,
				paymentUrl: `${process.env.APP_URL}/custom-orders/${order.id}/deposit`,
				bagStyle: order.bag_style,
				quotedTotal: quotedTotal,
			});
		} catch (e) {
			console.error("Deposit request email failed:", e);
		}
	}

	return json({ ok: true });
}

export default function AdminCustomOrders() {
	const { orders } = useLoaderData<typeof loader>();

	return (
		<AdminLayout>
			<div className="flex items-center justify-between mb-8">
				<h1 className="font-display font-light text-3xl text-bark">
					Custom Orders
				</h1>
				<span className="text-sm text-bark-mid">
					{(orders as any[]).length} total
				</span>
			</div>

			<div className="space-y-4">
				{(orders as any[]).map((order) => (
					<CustomOrderCard key={order.id} order={order} />
				))}

				{(orders as any[]).length === 0 && (
					<div className="bg-white border border-tan/30 rounded p-12 text-center text-bark-mid text-sm">
						No custom orders yet.
					</div>
				)}
			</div>
		</AdminLayout>
	);
}

function CustomOrderCard({ order }: { order: any }) {
	const [expanded, setExpanded] = React.useState(false);

	return (
		<div className="bg-white border border-tan/30 rounded overflow-hidden">
			<div
				onClick={() => setExpanded((e) => !e)}
				className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-cream/30 transition-colors"
			>
				<div className="flex items-center gap-4">
					<span className="font-medium text-bark">#{order.id}</span>
					<span className="text-sm text-bark">{order.customer_name}</span>
					<span className="text-sm text-bark-mid">{order.bag_style}</span>
				</div>
				<div className="flex items-center gap-4">
					{order.quoted_total && (
						<span className="text-sm font-medium text-bark">
							R {Number(order.quoted_total).toLocaleString("en-ZA")}
						</span>
					)}
					<span
						className={`text-[0.7rem] px-2 py-0.5 rounded uppercase tracking-wide ${
							statusColors[order.status] ?? "bg-gray-100 text-gray-500"
						}`}
					>
						{order.status.replace("_", " ")}
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
							<p className="text-sm text-bark">{order.customer_email}</p>
							<p className="text-sm text-bark">{order.customer_phone}</p>
						</div>
						<div>
							<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
								Specifications
							</p>
							<p className="text-sm text-bark">
								Leather: {order.leather_type_name ?? "—"}
							</p>
							<p className="text-sm text-bark flex items-center gap-2">
								Colour:
								{order.colour_hex && (
									<span
										className="w-3 h-3 rounded-full inline-block"
										style={{ backgroundColor: order.colour_hex }}
									/>
								)}
								{order.colour_name ?? "—"}
							</p>
							<p className="text-sm text-bark">
								Monogram: {order.monogram_text ?? "—"}
							</p>
							<p className="text-sm text-bark">
								Font: {order.font_preference ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
								Notes
							</p>
							<p className="text-sm text-bark-mid leading-relaxed">
								{order.special_instructions ?? "—"}
							</p>
						</div>
					</div>

					{/* Shipping address — shown once collected */}
					{order.shipping_address && (
						<div>
							<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
								Delivery Address
							</p>
							<p className="text-sm text-bark leading-relaxed">
								{order.shipping_address}
								<br />
								{order.shipping_suburb && `${order.shipping_suburb}, `}
								{order.shipping_city}
								<br />
								{order.shipping_province} {order.shipping_postal}
							</p>
						</div>
					)}
					{!order.shipping_address && order.status === "payment_complete" && (
						<p className="text-sm text-bark-mid/60 italic">
							Address not yet collected
						</p>
					)}

					{/* Send quote */}
					<div className="border-t border-tan/20 pt-5 grid md:grid-cols-2 gap-6">
						<Form method="post" className="flex items-end gap-3">
							<input type="hidden" name="_action" value="send_quote" />
							<input type="hidden" name="orderId" value={order.id} />
							<div className="flex-1">
								<label className="block text-[0.68rem] tracking-[0.1em] uppercase text-bark-mid mb-1">
									Quoted Total (R)
								</label>
								<input
									name="quoted_total"
									type="number"
									step="0.01"
									defaultValue={order.quoted_total ?? ""}
									required
									className="w-full bg-cream border border-tan/40 px-3 py-2 text-sm outline-none focus:border-tan"
								/>
							</div>
							<div className="flex-1">
								<label className="block text-[0.68rem] tracking-[0.1em] uppercase text-bark-mid mb-1">
									Deposit (R)
								</label>
								<input
									name="deposit_amount"
									type="number"
									step="0.01"
									defaultValue={order.deposit_amount ?? ""}
									required
									className="w-full bg-cream border border-tan/40 px-3 py-2 text-sm outline-none focus:border-tan"
								/>
							</div>
							<button
								type="submit"
								className="bg-accent text-cream px-5 py-2 text-[0.72rem] uppercase tracking-wide hover:bg-bark transition-colors cursor-pointer border-0 whitespace-nowrap"
							>
								Send Quote + Deposit Link
							</button>
						</Form>

						{/* Status update */}
						<Form method="post" className="flex items-end gap-3">
							<input type="hidden" name="_action" value="update_status" />
							<input type="hidden" name="orderId" value={order.id} />
							<div className="flex-1">
								<label className="block text-[0.68rem] tracking-[0.1em] uppercase text-bark-mid mb-1">
									Status
								</label>
								<select
									name="status"
									defaultValue={order.status}
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

					{/* Tracking number — shown when payment_complete or shipped */}
					{(order.status === "payment_complete" ||
						order.status === "shipped") && (
						<div>
							<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
								Waybill / Tracking
							</p>
							{order.tracking_number ? (
								<a
									href={`https://thecourierguy.co.za/tracking/?waybill=${order.tracking_number}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm font-medium text-accent hover:underline block mb-2"
								>
									{order.tracking_number} →
								</a>
							) : (
								<p className="text-sm text-bark-mid/60 italic mb-2">
									Create waybill on Courier Guy dashboard, then paste number
									here
								</p>
							)}
							<Form method="post" className="flex gap-2">
								<input type="hidden" name="_action" value="update_tracking" />
								<input type="hidden" name="orderId" value={order.id} />
								<input
									name="tracking_number"
									type="text"
									placeholder="Paste waybill number"
									defaultValue={order.tracking_number ?? ""}
									className="border border-tan/40 bg-white text-bark px-3 py-1.5 text-sm outline-none focus:border-tan flex-1"
								/>
								<button
									type="submit"
									className="bg-bark text-cream px-4 py-1.5 text-[0.72rem] uppercase tracking-wide hover:bg-accent transition-colors cursor-pointer border-0 whitespace-nowrap"
								>
									Save + Notify
								</button>
							</Form>
							<p className="text-[0.68rem] text-bark-mid/50 mt-1">
								Saving will email the customer their tracking number
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
