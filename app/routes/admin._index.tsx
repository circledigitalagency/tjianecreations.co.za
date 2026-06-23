import { json } from "@remix-run/node";
import { MetaFunction, useLoaderData } from "@remix-run/react";
import AdminLayout from "~/components/_layout/admin";
import { pool } from "~/db.server";

export const meta: MetaFunction = () => [
	{ title: "Admin Portal — Tjiane Creations" },
	{
		name: "description",
		content:
			"The story behind Tjiane Creations — a one-woman leather craft studio in Brakpan, South Africa.",
	},
];

export async function loader() {
	const [[{ total_products }]] = (await pool.query(
		"SELECT COUNT(*) AS total_products FROM products",
	)) as any;
	const [[{ total_orders }]] = (await pool.query(
		"SELECT COUNT(*) AS total_orders FROM orders",
	)) as any;
	const [[{ pending_customs }]] = (await pool.query(
		"SELECT COUNT(*) AS pending_customs FROM custom_orders WHERE status = 'submitted'",
	)) as any;

	return json({ total_products, total_orders, pending_customs });
}

export default function AdminDashboard() {
	const { total_products, total_orders, pending_customs } =
		useLoaderData<typeof loader>();

	const stats = [
		{
			label: "Products",
			value: total_products,
			icon: "ti-package",
			to: "/admin/products",
		},
		{
			label: "Orders",
			value: total_orders,
			icon: "ti-shopping-cart",
			to: "/admin/orders",
		},
		{
			label: "Custom (pending)",
			value: pending_customs,
			icon: "ti-pencil",
			to: "/admin/custom-orders",
		},
	];

	return (
		<AdminLayout>
			<div className="mb-8">
				<h1 className="font-display font-light text-3xl text-bark">
					Dashboard
				</h1>
				<p className="text-sm text-bark-mid mt-1">Welcome back.</p>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{stats.map(({ label, value, icon, to }) => (
					<a
						key={label}
						href={to}
						className="bg-white border border-tan/30 rounded p-5 no-underline hover:border-tan transition-colors block"
					>
						<i className={`ti ${icon} text-2xl text-tan-dark`} />
						<div className="font-display text-4xl font-light text-bark mt-3 mb-1">
							{value}
						</div>
						<div className="text-[0.72rem] tracking-[0.12em] uppercase text-bark-mid">
							{label}
						</div>
					</a>
				))}
			</div>
		</AdminLayout>
	);
}
