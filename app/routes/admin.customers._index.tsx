import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import AdminLayout from "~/components/_layout/admin";
import { pool } from "~/db.server";
import * as React from "react";
import { FileDown } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const search = url.searchParams.get("search") ?? "";

	const [customers] = (await pool.query(
		`SELECT
      c.id,
      c.name,
      c.email,
      c.phone,
      c.created_at,
      COUNT(o.id)        AS total_orders,
      SUM(o.total_amount) AS total_spent,
      MAX(o.created_at)  AS last_order_date
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    WHERE 1=1
      ${search ? "AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)" : ""}
    GROUP BY c.id
    ORDER BY c.created_at DESC`,
		search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [],
	)) as any;

	return json({ customers, search });
}

export default function AdminCustomers() {
	const { customers, search } = useLoaderData<typeof loader>();
	const [expanded, setExpanded] = React.useState<number | null>(null);

	return (
		<AdminLayout>
			<div className="flex items-center justify-between mb-8">
				<h1 className="font-display font-light text-3xl text-bark">
					Customers
				</h1>
				<span className="text-sm text-bark-mid">
					{(customers as any[]).length} total
				</span>
			</div>
			<div className="justify-end w-full flex">
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
				<div className="flex gap-3 max-w-md">
					<input
						name="search"
						type="text"
						defaultValue={search}
						placeholder="Search by name, email or phone..."
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
							href="/admin/customers"
							className="px-4 py-2 border border-tan/40 text-bark-mid text-sm hover:border-tan transition-colors no-underline flex items-center"
						>
							Clear
						</a>
					)}
				</div>
			</form>

			{/* Table */}
			<div className="bg-white border border-tan/30 rounded overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-cream border-b border-tan/30">
						<tr>
							{[
								"Customer",
								"Phone",
								"Orders",
								"Total Spent",
								"Last Order",
								"Member Since",
								"",
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
						{(customers as any[]).map((customer, i) => (
							<React.Fragment key={customer.id}>
								<tr
									className={`border-b border-tan/20 hover:bg-cream/40 transition-colors ${
										i % 2 !== 0 ? "bg-cream/20" : ""
									}`}
								>
									{/* Name + email */}
									<td className="px-4 py-3">
										<div className="font-medium text-bark">{customer.name}</div>
										<div className="text-[0.72rem] text-bark-mid">
											{customer.email}
										</div>
									</td>

									{/* Phone */}
									<td className="px-4 py-3 text-bark-mid">
										{customer.phone ?? "—"}
									</td>

									{/* Orders count */}
									<td className="px-4 py-3">
										<span
											className={`text-[0.7rem] px-2 py-0.5 rounded uppercase tracking-wide font-medium ${
												customer.total_orders > 0
													? "bg-green-100 text-green-700"
													: "bg-gray-100 text-gray-500"
											}`}
										>
											{customer.total_orders}
										</span>
									</td>

									{/* Total spent */}
									<td className="px-4 py-3 font-medium text-bark">
										{customer.total_spent
											? `R ${Number(customer.total_spent).toLocaleString(
													"en-ZA",
											  )}`
											: "—"}
									</td>

									{/* Last order */}
									<td className="px-4 py-3 text-bark-mid whitespace-nowrap">
										{customer.last_order_date
											? new Date(customer.last_order_date).toLocaleDateString(
													"en-ZA",
													{
														day: "numeric",
														month: "short",
														year: "numeric",
													},
											  )
											: "—"}
									</td>

									{/* Member since */}
									<td className="px-4 py-3 text-bark-mid whitespace-nowrap">
										{new Date(customer.created_at).toLocaleDateString("en-ZA", {
											day: "numeric",
											month: "short",
											year: "numeric",
										})}
									</td>

									{/* Expand */}
									<td className="px-4 py-3">
										<button
											onClick={() =>
												setExpanded(
													expanded === customer.id ? null : customer.id,
												)
											}
											className="text-[0.72rem] text-accent hover:underline cursor-pointer bg-transparent border-0 p-0"
										>
											{expanded === customer.id ? "Close" : "Orders"}
										</button>
									</td>
								</tr>

								{/* Expanded orders */}
								{expanded === customer.id && (
									<tr className={i % 2 !== 0 ? "bg-cream/20" : ""}>
										<td
											colSpan={7}
											className="px-6 py-5 border-b border-tan/20"
										>
											<CustomerOrders customerId={customer.id} />
										</td>
									</tr>
								)}
							</React.Fragment>
						))}

						{(customers as any[]).length === 0 && (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-16 text-center text-bark-mid text-sm"
								>
									No customers found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</AdminLayout>
	);
}

function CustomerOrders({ customerId }: { customerId: number }) {
	const [orders, setOrders] = React.useState<any[] | null>(null);

	React.useEffect(() => {
		fetch(`/admin/customers/${customerId}/orders`)
			.then((r) => r.json())
			.then((data) => setOrders(data.orders));
	}, [customerId]);

	if (!orders) {
		return <p className="text-sm text-bark-mid/60 italic">Loading orders…</p>;
	}

	if (orders.length === 0) {
		return <p className="text-sm text-bark-mid/60 italic">No orders yet.</p>;
	}

	return (
		<div>
			<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-3">
				Order History
			</p>
			<div className="space-y-2">
				{orders.map((order) => (
					<div
						key={order.id}
						className="flex items-center gap-6 text-sm border border-tan/20 px-4 py-2.5 bg-white"
					>
						<span className="font-medium text-bark w-16">#{order.id}</span>
						<span className="text-bark-mid w-28 whitespace-nowrap">
							{new Date(order.created_at).toLocaleDateString("en-ZA", {
								day: "numeric",
								month: "short",
								year: "numeric",
							})}
						</span>
						<span
							className={`text-[0.7rem] px-2 py-0.5 rounded uppercase tracking-wide ${
								order.status === "delivered"
									? "bg-green-100 text-green-700"
									: order.status === "shipped"
									? "bg-orange-100 text-orange-700"
									: order.status === "paid"
									? "bg-blue-100 text-blue-700"
									: "bg-gray-100 text-gray-500"
							}`}
						>
							{order.status.replace("_", " ")}
						</span>
						<span className="text-bark font-medium ml-auto">
							R {Number(order.total_amount).toLocaleString("en-ZA")}
						</span>

						<a
							href={`/admin/orders?search=${order.id}`}
							className="text-[0.72rem] text-accent hover:underline no-underline"
						>
							View →
						</a>
					</div>
				))}
			</div>
		</div>
	);
}
