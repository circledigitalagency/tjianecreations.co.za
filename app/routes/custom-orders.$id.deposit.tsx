import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
	const [[order]] = (await pool.query(
		`SELECT co.*, lt.name AS leather_type_name
     FROM custom_orders co
     LEFT JOIN leather_types lt ON co.leather_type_id = lt.id
     WHERE co.id = ?`,
		[params.id],
	)) as any;

	if (!order) throw new Response("Not Found", { status: 404 });

	// If deposit already paid, redirect to success
	if (order.status !== "submitted" && order.status !== "deposit_paid") {
		return redirect(`/custom-orders/${params.id}/deposit-success`);
	}

	if (!order.deposit_amount) {
		// Quote not sent yet
		return json({ order, notReady: true });
	}

	return json({ order, notReady: false });
}

export async function action({ params }: ActionFunctionArgs) {
	const [[order]] = (await pool.query(
		"SELECT * FROM custom_orders WHERE id = ?",
		[params.id],
	)) as any;

	if (!order || !order.deposit_amount) {
		return json(
			{ error: "This order is not ready for payment." },
			{ status: 400 },
		);
	}

	// Create Yoco checkout
	const yocoRes = await fetch("https://payments.yoco.com/api/checkouts", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
			"Content-Type": "application/json",
			"Idempotency-Key": `custom-deposit-${order.id}-${Date.now()}`,
		},
		body: JSON.stringify({
			amount: Math.round(Number(order.deposit_amount) * 100),
			currency: "ZAR",
			cancelUrl: `${process.env.APP_URL}/custom-orders/${order.id}/deposit`,
			failureUrl: `${process.env.APP_URL}/custom-orders/${order.id}/deposit?error=failed`,
			metadata: {
				type: "custom_order_deposit",
				customOrderId: String(order.id),
				customerName: order.customer_name,
				customerEmail: order.customer_email,
			},
		}),
	});

	const yocoData = await yocoRes.json();

	if (!yocoData.id || !yocoData.redirectUrl) {
		return json(
			{ error: "Could not initiate payment. Please try again." },
			{ status: 400 },
		);
	}

	// Patch successUrl with the checkout ID
	await fetch(`https://payments.yoco.com/api/checkouts/${yocoData.id}`, {
		method: "PATCH",
		headers: {
			Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			successUrl: `${process.env.APP_URL}/custom-orders/${order.id}/deposit-success?checkoutId=${yocoData.id}`,
		}),
	});

	return redirect(yocoData.redirectUrl);
}

export default function CustomOrderDeposit() {
	const { order, notReady } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	if (notReady) {
		return (
			<MainLayout>
				<div className="px-16 py-32 max-w-lg mx-auto text-center">
					<h1 className="font-display font-light text-3xl text-bark mb-4">
						Quote not ready yet
					</h1>
					<p className="text-bark-mid font-light">
						We haven't sent your quote yet. Keep an eye on your email — you'll
						receive a payment link once we've reviewed your order.
					</p>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			<div className="px-16 py-24 max-w-lg mx-auto text-center">
				<p className="text-[0.7rem] tracking-[0.2em] uppercase text-tan-dark mb-3">
					Custom Order #{order.id}
				</p>
				<h1 className="font-display font-light text-3xl text-bark mb-4">
					Confirm Your Order
				</h1>
				<p className="text-bark-mid font-light mb-8">
					Hi {order.customer_name} — your quote is ready. Pay the deposit below
					to begin crafting your {order.bag_style}.
				</p>

				{actionData?.error && (
					<div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
						{actionData.error}
					</div>
				)}

				<div className="bg-cream-white border border-tan/30 p-6 mb-8 text-left">
					<div className="flex justify-between text-sm mb-2">
						<span className="text-bark-mid">Item</span>
						<span className="text-bark">{order.bag_style}</span>
					</div>
					{order.monogram_text && (
						<div className="flex justify-between text-sm mb-2">
							<span className="text-bark-mid">Personalisation</span>
							<span className="text-bark">{order.monogram_text}</span>
						</div>
					)}
					<div className="flex justify-between text-sm mb-2 border-t border-tan/20 pt-3 mt-3">
						<span className="text-bark-mid">Quoted Total</span>
						<span className="text-bark font-medium">
							R {Number(order.quoted_total).toLocaleString("en-ZA")}
						</span>
					</div>
					<div className="flex justify-between text-sm border-t border-tan/20 pt-3 mt-3">
						<span className="text-bark-mid font-medium">
							Deposit Due Now (50%)
						</span>
						<span className="text-bark font-semibold text-lg">
							R {Number(order.deposit_amount).toLocaleString("en-ZA")}
						</span>
					</div>
					<div className="flex justify-between text-sm mt-2">
						<span className="text-bark-mid">
							Balance (paid before dispatch)
						</span>
						<span className="text-bark-mid">
							R{" "}
							{(
								Number(order.quoted_total) - Number(order.deposit_amount)
							).toLocaleString("en-ZA")}
						</span>
					</div>
				</div>

				<Form method="post">
					<button
						type="submit"
						className="bg-accent text-cream px-10 py-3.5 text-[0.8rem] tracking-[0.12em] uppercase hover:bg-bark transition-colors cursor-pointer border-0"
					>
						Pay R {Number(order.deposit_amount).toLocaleString("en-ZA")} Deposit
					</button>
				</Form>
			</div>
		</MainLayout>
	);
}
