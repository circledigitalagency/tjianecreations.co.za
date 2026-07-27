import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
	useLoaderData,
	Form,
	useNavigation,
	MetaFunction,
} from "@remix-run/react";
import AdminLayout from "~/components/_layout/admin";
import { pool } from "~/db.server";
import { createShipment, getWaybillUrl } from "~/shiplogic.server";
import { FileDown } from "lucide-react";
import { Truck, ExternalLink } from "lucide-react";
import { sendOrderShippedEmail } from "~/email.server";

export const meta: MetaFunction = () => [
	{ title: "Admin Orders" },
	{
		name: "description",
		content:
			"The story behind Tjiane Creations — a one-woman leather craft studio in Brakpan, South Africa.",
	},
];

const statusColors: Record<string, string> = {
	pending_payment: "bg-yellow-100 text-yellow-700",
	paid: "bg-blue-100 text-blue-700",
	processing: "bg-purple-100 text-purple-700",
	shipped: "bg-orange-100 text-orange-700",
	delivered: "bg-green-100 text-green-700",
	cancelled: "bg-red-100 text-red-700",
	refunded: "bg-gray-100 text-gray-500",
};

const allStatuses = [
	"pending_payment",
	"paid",
	"processing",
	"shipped",
	"delivered",
	"cancelled",
	"refunded",
];

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const statusFilter = url.searchParams.get("status") ?? "all";
	const search = url.searchParams.get("search") ?? "";

	const [orders] = (await pool.query(
		`SELECT
    o.id, o.status, o.total_amount, o.shipping_method,
    o.shipping_address,
    o.tracking_number, o.yoco_charge_id, o.created_at,
    c.name  AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
  FROM orders o
  JOIN customers c ON o.customer_id = c.id
    WHERE 1=1
      ${statusFilter !== "all" ? "AND o.status = ?" : ""}
      ${search ? "AND (c.name LIKE ? OR c.email LIKE ? OR o.id = ?)" : ""}
    ORDER BY o.created_at DESC`,
		[
			...(statusFilter !== "all" ? [statusFilter] : []),
			...(search ? [`%${search}%`, `%${search}%`, parseInt(search) || 0] : []),
		],
	)) as any;

	// Summary counts for the filter bar
	const [counts] = (await pool.query(
		`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`,
	)) as any;

	const countMap: Record<string, number> = { all: 0 };
	for (const row of counts as any[]) {
		countMap[row.status] = Number(row.count);
		countMap.all += Number(row.count);
	}

	return json({ orders, countMap, statusFilter, search });
}

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();
	const _action = form.get("_action") as string;
	const orderId = form.get("orderId");

	if (_action === "create_waybill") {
		const orderId = form.get("orderId") as string;
		const customerName = form.get("customerName") as string;
		const customerPhone = form.get("customerPhone") as string;
		const customerEmail = form.get("customerEmail") as string;
		const shippingStreet = form.get("shippingStreet") as string;
		const shippingSuburb = form.get("shippingSuburb") as string;
		const shippingCity = form.get("shippingCity") as string;
		const shippingPostal = form.get("shippingPostal") as string;
		const shippingProvince = form.get("shippingProvince") as string;

		const shipment = await createShipment({
			orderId: parseInt(orderId),
			customerName,
			customerPhone,
			customerEmail,
			deliveryAddress: shippingStreet,
			deliverySuburb: shippingSuburb,
			deliveryCity: shippingCity,
			deliveryPostal: shippingPostal,
			deliveryProvince: shippingProvince,
		});

		console.log("ShipLogic response:", JSON.stringify(shipment, null, 2));

		if (shipment.id) {
			// Save waybill number + update status to shipped
			await pool.query(
				`UPDATE orders
       SET tracking_number = ?,
           status = 'shipped'
       WHERE id = ?`,
				[shipment.tracking_reference ?? shipment.id, orderId],
			);

			// Get waybill PDF URL
			const waybill = await getWaybillUrl(shipment.id);
			console.log("Waybill PDF:", waybill);

			return json({
				ok: true,
				waybillUrl: waybill?.url ?? null,
				shipmentId: shipment.id,
			});
		}

		return json(
			{ ok: false, error: shipment.message ?? "Failed to create waybill" },
			{ status: 400 },
		);
	}

	if (_action === "update_status") {
		const status = form.get("status") as string;
		const orderId = form.get("orderId") as string;

		await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
			status,
			orderId,
		]);

		// Send shipping email when status changes to shipped
		if (status === "shipped") {
			const [[order]] = (await pool.query(
				`SELECT o.id, o.tracking_number, o.shipping_method,
              c.name AS customer_name, c.email AS customer_email
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.id = ?`,
				[orderId],
			)) as any;

			try {
				await sendOrderShippedEmail({
					id: order.id,
					customerName: order.customer_name,
					customerEmail: order.customer_email,
					trackingNumber: order.tracking_number,
					shippingMethod: order.shipping_method,
				});
			} catch (e) {
				console.error("Failed to send shipping email:", e);
			}
		}

		return json({ ok: true });
	}

	if (_action === "update_tracking") {
		const tracking = form.get("tracking_number") as string;
		const orderId = form.get("orderId") as string;

		await pool.query(
			"UPDATE orders SET tracking_number = ?, status = 'shipped' WHERE id = ?",
			[tracking, orderId],
		);

		const [[order]] = (await pool.query(
			`SELECT o.id, o.tracking_number, o.shipping_method,
            c.name AS customer_name, c.email AS customer_email
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE o.id = ?`,
			[orderId],
		)) as any;

		try {
			await sendOrderShippedEmail({
				id: order.id,
				customerName: order.customer_name,
				customerEmail: order.customer_email,
				trackingNumber: order.tracking_number,
				shippingMethod: order.shipping_method,
			});
		} catch (e) {
			console.error("Failed to send shipping email:", e);
		}

		return json({ ok: true });
	}

	return json({ ok: true });
}

export default function AdminOrders() {
	const { orders, countMap, statusFilter, search } =
		useLoaderData<typeof loader>();
	const navigation = useNavigation();
	const isLoading = navigation.state === "loading";

	return (
		<AdminLayout>
			<div className="flex items-center justify-between mb-8">
				<h1 className="font-display font-light text-3xl text-bark">Orders</h1>
				<span className="text-sm text-bark-mid">
					{countMap.all ?? 0} total orders
				</span>
			</div>

			{/* Status filter tabs */}
			<div className="flex justify-between">
				<div className="flex gap-2 flex-wrap mb-5">
					{[
						{ key: "all", label: "All" },
						...allStatuses.map((s) => ({ key: s, label: s.replace("_", " ") })),
					].map(({ key, label }) =>
						countMap[key] !== undefined || key === "all" ? (
							<a
								key={key}
								href={`/admin/orders${key === "all" ? "" : `?status=${key}`}${
									search ? `&search=${search}` : ""
								}`}
								className={`px-3 py-1.5 text-[0.72rem] tracking-[0.1em] uppercase rounded transition-colors no-underline ${
									statusFilter === key ||
									(key === "all" && statusFilter === "all")
										? "bg-bark text-cream"
										: "bg-white border border-tan/30 text-bark-mid hover:border-tan"
								}`}
							>
								{label}
								{countMap[key] !== undefined && (
									<span className="ml-1.5 opacity-60">({countMap[key]})</span>
								)}
							</a>
						) : null,
					)}
				</div>
				<a
					href="/admin/export/orders"
					className="flex items-center gap-2 border border-tan/40 text-bark-mid px-4 py-2 text-[0.75rem] tracking-[0.1em] uppercase no-underline hover:border-tan hover:text-bark transition-colors"
				>
					<FileDown size={14} />
					Export Table
				</a>
			</div>

			{/* Search */}
			<form method="get" className="mb-6">
				{statusFilter !== "all" && (
					<input type="hidden" name="status" value={statusFilter} />
				)}
				<div className="flex gap-3 max-w-md">
					<input
						name="search"
						type="text"
						defaultValue={search}
						placeholder="Search by name, email or order #..."
						className="flex-1 border border-tan/40 bg-white text-bark px-4 py-2 text-sm outline-none focus:border-tan transition-colors"
					/>
					<button
						type="submit"
						className="bg-bark text-cream px-5 py-2 text-[0.78rem] uppercase tracking-wider hover:bg-accent transition-colors cursor-pointer border-0"
					>
						Search
					</button>
					{search && (
						<a
							href="/admin/orders"
							className="px-4 py-2 border border-tan/40 text-bark-mid text-sm hover:border-tan transition-colors no-underline flex items-center"
						>
							Clear
						</a>
					)}
				</div>
			</form>

			{/* Orders table */}
			<div
				className={`bg-white border border-tan/30 rounded overflow-hidden transition-opacity ${
					isLoading ? "opacity-50" : ""
				}`}
			>
				<table className="w-full text-sm">
					<thead className="bg-cream border-b border-tan/30">
						<tr>
							{[
								"Order",
								"Customer",
								"Items",
								"Total",
								"Shipping",
								"Status",
								"Date",
								"Actions",
							].map((h) => (
								<th
									key={h}
									className="text-left px-4 py-3 text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid font-normal whitespace-nowrap"
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{(orders as any[]).map((order, i) => (
							<OrderRow key={order.id} order={order} zebra={i % 2 !== 0} />
						))}
						{(orders as any[]).length === 0 && (
							<tr>
								<td
									colSpan={8}
									className="px-4 py-16 text-center text-bark-mid text-sm"
								>
									No orders found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</AdminLayout>
	);
}

function OrderRow({ order, zebra }: { order: any; zebra: boolean }) {
	const [expanded, setExpanded] = React.useState(false);

	return (
		<>
			<tr
				className={`border-b border-tan/20 ${
					zebra ? "bg-cream/20" : ""
				} hover:bg-cream/40 transition-colors`}
			>
				{/* Order # */}
				<td className="px-4 py-3">
					<button
						onClick={() => setExpanded((e) => !e)}
						className="font-medium text-bark hover:text-accent transition-colors cursor-pointer bg-transparent border-0 p-0 flex items-center gap-1.5"
					>
						<i
							className={`ti ${
								expanded ? "ti-chevron-down" : "ti-chevron-right"
							} text-xs text-bark-mid`}
						/>
						#{order.id}
					</button>
					{order.yoco_charge_id && (
						<div className="text-[0.65rem] text-bark-mid/50 font-mono mt-0.5 truncate max-w-[100px]">
							{order.yoco_charge_id}
						</div>
					)}
				</td>

				{/* Customer */}
				<td className="px-4 py-3">
					<div className="font-medium text-bark">{order.customer_name}</div>
					<div className="text-[0.72rem] text-bark-mid">
						{order.customer_email}
					</div>
					{order.customer_phone && (
						<div className="text-[0.72rem] text-bark-mid">
							{order.customer_phone}
						</div>
					)}
				</td>

				{/* Items */}
				<td className="px-4 py-3 text-bark-mid text-center">
					{order.item_count}
				</td>

				{/* Total */}
				<td className="px-4 py-3 font-medium text-bark whitespace-nowrap">
					R {Number(order.total_amount).toLocaleString("en-ZA")}
				</td>

				{/* Shipping method */}
				<td className="px-4 py-3 text-bark-mid capitalize whitespace-nowrap">
					{order.shipping_method?.replace("_", " ") ?? "—"}
				</td>

				{/* Status dropdown */}
				<td className="px-4 py-3">
					<Form method="post" className="flex items-center gap-2">
						<input type="hidden" name="_action" value="update_status" />
						<input type="hidden" name="orderId" value={order.id} />
						<select
							name="status"
							defaultValue={order.status}
							onChange={(e) => e.currentTarget.form?.requestSubmit()}
							className={`text-[0.7rem] px-2 py-1 rounded uppercase tracking-wide border-0 cursor-pointer font-body ${
								statusColors[order.status] ?? "bg-gray-100 text-gray-500"
							}`}
						>
							{allStatuses.map((s) => (
								<option key={s} value={s}>
									{s.replace("_", " ")}
								</option>
							))}
						</select>
					</Form>
				</td>

				{/* Date */}
				<td className="px-4 py-3 text-bark-mid whitespace-nowrap">
					{new Date(order.created_at).toLocaleDateString("en-ZA", {
						day: "numeric",
						month: "short",
						year: "numeric",
					})}
				</td>

				{/* Actions */}
				<td className="px-4 py-3">
					<button
						onClick={() => setExpanded((e) => !e)}
						className="text-[0.72rem] text-accent hover:underline cursor-pointer bg-transparent border-0 p-0"
					>
						{expanded ? "Close" : "Details"}
					</button>
				</td>
			</tr>

			{/* Expanded detail row */}
			{expanded && (
				<tr className={`${zebra ? "bg-cream/20" : ""} border-b border-tan/20`}>
					<td colSpan={8} className="px-6 py-5">
						<div className="grid md:grid-cols-3 gap-6">
							{/* Shipping address */}
							<div>
								<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
									Delivery Address
								</p>
								<p className="text-sm text-bark leading-relaxed">
									{order.shipping_address ?? "—"}
								</p>
							</div>

							{/* Order items */}
							<div>
								<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
									Order Items
								</p>
								<OrderItems orderId={order.id} />
							</div>

							{/* Tracking number */}
							<div>
								<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
									Tracking Number
								</p>
								{order.tracking_number ? (
									<p className="text-sm font-medium text-bark mb-3">
										{order.tracking_number}
									</p>
								) : (
									<p className="text-sm text-bark-mid/60 italic mb-3">
										Not yet assigned
									</p>
								)}
								<Form method="post" className="flex gap-2">
									<input type="hidden" name="_action" value="update_tracking" />
									<input type="hidden" name="orderId" value={order.id} />
									<input
										name="tracking_number"
										type="text"
										placeholder="Enter tracking #"
										defaultValue={order.tracking_number ?? ""}
										className="border border-tan/40 bg-white text-bark px-3 py-1.5 text-sm outline-none focus:border-tan flex-1"
									/>
									<button
										type="submit"
										className="bg-bark text-cream px-4 py-1.5 text-[0.72rem] uppercase tracking-wide hover:bg-accent transition-colors cursor-pointer border-0"
									>
										Save
									</button>
								</Form>
								<p className="text-[0.68rem] text-bark-mid/50 mt-1">
									Saving will also mark order as Shipped
								</p>
							</div>

							{/* Waybill + tracking section */}
							<div>
								<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-2">
									Courier Guy
								</p>

								{order.tracking_number ? (
									// Already has a waybill
									<div className="space-y-3">
										<p className="text-sm font-medium text-bark">
											Waybill: {order.tracking_number}
										</p>
										<a
											href={`https://thecourierguy.co.za/tracking/?waybill=${order.tracking_number}`}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 text-[0.72rem] text-accent hover:underline no-underline"
										>
											Track parcel <ExternalLink size={11} />
										</a>
									</div>
								) : (
									// Create waybill form
									<Form method="post">
										<input
											type="hidden"
											name="_action"
											value="create_waybill"
										/>
										<input type="hidden" name="orderId" value={order.id} />
										<input
											type="hidden"
											name="customerName"
											value={order.customer_name}
										/>
										<input
											type="hidden"
											name="customerPhone"
											value={order.customer_phone ?? ""}
										/>
										<input
											type="hidden"
											name="customerEmail"
											value={order.customer_email}
										/>
										<input
											type="hidden"
											name="shippingStreet"
											value={
												order.shipping_street ?? order.shipping_address ?? ""
											}
										/>
										<input
											type="hidden"
											name="shippingSuburb"
											value={order.shipping_suburb ?? ""}
										/>
										<input
											type="hidden"
											name="shippingCity"
											value={order.shipping_city ?? ""}
										/>
										<input
											type="hidden"
											name="shippingPostal"
											value={order.shipping_postal ?? ""}
										/>
										<input
											type="hidden"
											name="shippingProvince"
											value={order.shipping_province ?? ""}
										/>
										<button
											type="submit"
											className="flex items-center gap-2 bg-bark text-cream px-5 py-2.5 text-[0.75rem] uppercase tracking-wider hover:bg-accent transition-colors cursor-pointer border-0"
										>
											<Truck size={14} />
											Create Waybill
										</button>
									</Form>
								)}

								{/* Manual tracking number fallback */}
								<div className="mt-3">
									<Form method="post" className="flex gap-2">
										<input
											type="hidden"
											name="_action"
											value="update_tracking"
										/>
										<input type="hidden" name="orderId" value={order.id} />
										<input
											name="tracking_number"
											type="text"
											placeholder="Or enter manually"
											defaultValue={order.tracking_number ?? ""}
											className="border border-tan/40 bg-white text-bark px-3 py-1.5 text-sm outline-none focus:border-tan flex-1"
										/>
										<button
											type="submit"
											className="bg-bark text-cream px-4 py-1.5 text-[0.72rem] uppercase tracking-wide hover:bg-accent transition-colors cursor-pointer border-0"
										>
											Save
										</button>
									</Form>
								</div>
							</div>
						</div>
					</td>
				</tr>
			)}
		</>
	);
}

function OrderItems({ orderId }: { orderId: number }) {
	const [items, setItems] = React.useState<any[] | null>(null);

	React.useEffect(() => {
		fetch(`/admin/orders/${orderId}/items`)
			.then((r) => r.json())
			.then((data) => setItems(data.items));
	}, [orderId]);

	if (!items)
		return <p className="text-sm text-bark-mid/60 italic">Loading…</p>;
	if (items.length === 0)
		return <p className="text-sm text-bark-mid/60 italic">No items found.</p>;

	return (
		<div className="space-y-3">
			{items.map((item) => (
				<div key={item.id} className="flex items-center gap-3">
					{/* Image */}
					<div className="w-10 h-10 shrink-0 overflow-hidden bg-gradient-to-br from-tan-light to-tan rounded">
						{item.image_url ? (
							<img
								src={item.image_url}
								alt={item.product_name}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-sm opacity-30">
								👜
							</div>
						)}
					</div>

					{/* Details */}
					<div className="flex-1 min-w-0">
						<span className="text-sm text-bark font-medium truncate block">
							{item.product_name}
						</span>
						{item.colour && (
							<span className="text-[0.72rem] text-bark-mid">
								{item.colour}
							</span>
						)}
					</div>

					{/* Price */}
					<div className="text-sm text-bark font-medium shrink-0">
						× {item.quantity} · R{" "}
						{(item.unit_price * item.quantity).toLocaleString("en-ZA")}
					</div>
				</div>
			))}
		</div>
	);
}

// Need React in scope for useState/useEffect
import * as React from "react";
