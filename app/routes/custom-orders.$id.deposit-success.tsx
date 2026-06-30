import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const checkoutId = url.searchParams.get("checkoutId");
	if (!checkoutId) return redirect("/");

	const yocoRes = await fetch(
		`https://payments.yoco.com/api/checkouts/${checkoutId}`,
		{ headers: { Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}` } },
	);
	const yocoData = await yocoRes.json();

	if (!["complete", "completed"].includes(yocoData.status)) {
		return redirect(`/custom-orders/${params.id}/deposit`);
	}

	await pool.query(
		"UPDATE custom_orders SET status = 'deposit_paid', deposit_paid = ?, yoco_deposit_id = ? WHERE id = ?",
		[yocoData.amount / 100, checkoutId, params.id],
	);

	const [[order]] = (await pool.query(
		"SELECT * FROM custom_orders WHERE id = ?",
		[params.id],
	)) as any;

	return json({ order });
}

export default function DepositSuccess() {
	const { order } = useLoaderData<typeof loader>();

	return (
		<MainLayout>
			<div className="px-16 py-32 max-w-lg mx-auto text-center">
				<div className="text-5xl mb-6">🎉</div>
				<h1 className="font-display font-light text-3xl text-bark mb-4">
					Deposit Received
				</h1>
				<p className="text-bark-mid font-light leading-relaxed mb-8">
					Thank you, {order.customer_name}! Your custom order is confirmed and
					we'll begin crafting your {order.bag_style.toLowerCase()} shortly.
					Allow 7–14 business days.
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
