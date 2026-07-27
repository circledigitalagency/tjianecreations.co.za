import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";
import {
	sendCustomOrderStatusEmail,
	sendCustomOrderDepositAdminNotification,
} from "~/email.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const checkoutId = url.searchParams.get("checkoutId");

	if (!checkoutId) return redirect("/");

	// Verify with Yoco
	const yocoRes = await fetch(
		`https://payments.yoco.com/api/checkouts/${checkoutId}`,
		{ headers: { Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}` } },
	);
	const yocoData = await yocoRes.json();

	if (!["complete", "completed"].includes(yocoData.status)) {
		return redirect(`/custom-orders/${params.id}/deposit?error=payment_failed`);
	}

	// Prevent duplicate processing on refresh
	const [[existing]] = (await pool.query(
		"SELECT id FROM custom_orders WHERE id = ? AND yoco_deposit_id = ?",
		[params.id, checkoutId],
	)) as any;

	if (!existing) {
		await pool.query(
			`UPDATE custom_orders
       SET status = 'deposit_paid',
           deposit_paid = ?,
           yoco_deposit_id = ?
       WHERE id = ?`,
			[yocoData.amount / 100, checkoutId, params.id],
		);

		const [[order]] = (await pool.query(
			"SELECT * FROM custom_orders WHERE id = ?",
			[params.id],
		)) as any;

		// Notify customer
		try {
			await sendCustomOrderStatusEmail({
				id: order.id,
				customerName: order.customer_name,
				customerEmail: order.customer_email,
				bagStyle: order.bag_style,
				status: "deposit_paid",
			});
		} catch (e) {
			console.error("Failed to send deposit confirmation email:", e);
		}

		// Notify Eva
		try {
			await sendCustomOrderDepositAdminNotification({
				id: order.id,
				customerName: order.customer_name,
				customerEmail: order.customer_email,
				bagStyle: order.bag_style,
				depositPaid: Number(order.deposit_paid),
			});
		} catch (e) {
			console.error("Failed to send admin deposit notification:", e);
		}
	}

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
					Thank you, {order.customer_name}! Your custom {order.bag_style} is
					confirmed and we'll begin crafting it shortly. Allow 7–14 business
					days. We'll keep you updated by email.
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
