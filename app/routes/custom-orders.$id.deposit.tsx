import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
	const [[order]] = (await pool.query(
		"SELECT * FROM custom_orders WHERE id = ?",
		[params.id],
	)) as any;

	if (!order || !order.deposit_amount) {
		throw new Response("Not Found", { status: 404 });
	}

	return json({ order });
}

export async function action({ request, params }: ActionFunctionArgs) {
	const [[order]] = (await pool.query(
		"SELECT * FROM custom_orders WHERE id = ?",
		[params.id],
	)) as any;

	const yocoRes = await fetch("https://payments.yoco.com/api/checkouts", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
			"Content-Type": "application/json",
			"Idempotency-Key": `custom-${order.id}-${Date.now()}`,
		},
		body: JSON.stringify({
			amount: Math.round(Number(order.deposit_amount) * 100),
			currency: "ZAR",
			cancelUrl: `${process.env.APP_URL}/custom-orders/${order.id}/deposit`,
			metadata: {
				customOrderId: String(order.id),
				type: "custom_order_deposit",
			},
		}),
	});

	const yocoData = await yocoRes.json();

	if (!yocoData.id || !yocoData.redirectUrl) {
		return json(
			{ error: "Could not start payment. Please try again." },
			{ status: 400 },
		);
	}

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
	const { order } = useLoaderData<typeof loader>();

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
					Hi {order.customer_name}, your quote is ready. Pay the deposit below
					to begin crafting your {order.bag_style.toLowerCase()}.
				</p>

				<div className="bg-cream-white border border-tan/30 p-6 mb-8 text-left">
					<div className="flex justify-between mb-2 text-sm">
						<span className="text-bark-mid">Quoted Total</span>
						<span className="text-bark font-medium">
							R {Number(order.quoted_total).toLocaleString("en-ZA")}
						</span>
					</div>
					<div className="flex justify-between text-sm border-t border-tan/20 pt-2">
						<span className="text-bark-mid">Deposit Due Now</span>
						<span className="text-bark font-semibold">
							R {Number(order.deposit_amount).toLocaleString("en-ZA")}
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
