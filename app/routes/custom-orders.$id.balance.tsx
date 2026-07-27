import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";

const provinces = [
	"Eastern Cape",
	"Free State",
	"Gauteng",
	"KwaZulu-Natal",
	"Limpopo",
	"Mpumalanga",
	"Northern Cape",
	"North West",
	"Western Cape",
];

export async function loader({ params }: LoaderFunctionArgs) {
	const [[order]] = (await pool.query(
		"SELECT * FROM custom_orders WHERE id = ?",
		[params.id],
	)) as any;

	if (!order) throw new Response("Not Found", { status: 404 });

	const balance =
		Number(order.quoted_total) -
		Number(order.deposit_paid ?? order.deposit_amount);

	return json({ order, balance });
}

export async function action({ params, request }: ActionFunctionArgs) {
	try {
		const form = await request.formData();

		const address = form.get("address") as string;
		const suburb = form.get("suburb") as string;
		const city = form.get("city") as string;
		const province = form.get("province") as string;
		const postal = form.get("postal") as string;

		if (!address || !city || !postal) {
			return json(
				{ error: "Please fill in your delivery address." },
				{ status: 400 },
			);
		}

		// Save address to the custom order
		await pool.query(
			`UPDATE custom_orders
     SET shipping_address = ?, shipping_suburb = ?,
         shipping_city = ?, shipping_province = ?, shipping_postal = ?
     WHERE id = ?`,
			[address, suburb, city, province, postal, params.id],
		);

		const [[order]] = (await pool.query(
			"SELECT * FROM custom_orders WHERE id = ?",
			[params.id],
		)) as any;

		const balance =
			Number(order.quoted_total) -
			Number(order.deposit_paid ?? order.deposit_amount);

		// Create Yoco checkout for balance
		const yocoRes = await fetch("https://payments.yoco.com/api/checkouts", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
				"Content-Type": "application/json",
				"Idempotency-Key": `custom-balance-${order.id}-${Date.now()}`,
			},
			body: JSON.stringify({
				amount: Math.round(balance * 100),
				currency: "ZAR",
				cancelUrl: `${process.env.APP_URL}/custom-orders/${order.id}/balance`,
				metadata: {
					type: "custom_order_balance",
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

		await fetch(`https://payments.yoco.com/api/checkouts/${yocoData.id}`, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				successUrl: `${process.env.APP_URL}/custom-orders/${order.id}/balance-success?checkoutId=${yocoData.id}`,
			}),
		});

		return redirect(yocoData.redirectUrl);
	} catch (e) {
		console.error("Balance action error:", e);
		return json(
			{ error: "Something went wrong. Please try again." },
			{ status: 500 },
		);
	}
}

export default function CustomOrderBalance() {
	const { order, balance } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	return (
		<MainLayout>
			<div className="px-16 py-24 max-w-lg mx-auto">
				<p className="text-[0.7rem] tracking-[0.2em] uppercase text-tan-dark mb-3 text-center">
					Custom Order #{order.id}
				</p>
				<h1 className="font-display font-light text-3xl text-bark mb-2 text-center">
					Final Balance Payment
				</h1>
				<p className="text-bark-mid font-light mb-8 text-center">
					Your {order.bag_style} is ready! Fill in your delivery address and pay
					the remaining balance.
				</p>

				{actionData?.error && (
					<div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
						{actionData.error}
					</div>
				)}

				{/* Order summary */}
				<div className="bg-cream-white border border-tan/30 p-6 mb-6">
					<div className="flex justify-between text-sm mb-2">
						<span className="text-bark-mid">Quoted total</span>
						<span className="text-bark">
							R {Number(order.quoted_total).toLocaleString("en-ZA")}
						</span>
					</div>
					<div className="flex justify-between text-sm mb-3">
						<span className="text-bark-mid">Deposit paid</span>
						<span className="text-bark">
							R {Number(order.deposit_paid).toLocaleString("en-ZA")}
						</span>
					</div>
					<div className="flex justify-between border-t border-tan/20 pt-3">
						<span className="text-bark font-medium">Balance due</span>
						<span className="font-display text-lg text-bark">
							R {balance.toLocaleString("en-ZA")}
						</span>
					</div>
				</div>

				{/* Address + payment form */}
				<Form method="post" className="space-y-4">
					<p className="text-[0.7rem] tracking-[0.2em] uppercase text-tan-dark mb-1">
						Delivery Address
					</p>

					<div>
						<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
							Street Address *
						</label>
						<input
							name="address"
							type="text"
							required
							placeholder="12 Main Road"
							className="form-field"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
								Suburb
							</label>
							<input
								name="suburb"
								type="text"
								placeholder="Sandton"
								className="form-field"
							/>
						</div>
						<div>
							<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
								City *
							</label>
							<input
								name="city"
								type="text"
								required
								placeholder="Johannesburg"
								className="form-field"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
								Province
							</label>
							<select name="province" className="form-field">
								{provinces.map((p) => (
									<option key={p}>{p}</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
								Postal Code *
							</label>
							<input
								name="postal"
								type="text"
								required
								placeholder="2196"
								className="form-field"
							/>
						</div>
					</div>

					<button
						type="submit"
						className="w-full bg-accent text-cream py-3.5 text-[0.8rem] tracking-[0.12em] uppercase hover:bg-bark transition-colors cursor-pointer border-0 mt-2"
					>
						Pay R {balance.toLocaleString("en-ZA")} Balance
					</button>
				</Form>
			</div>

			<style>{`
        .form-field {
          width: 100%;
          border: 1px solid rgba(200,169,122,0.4);
          background: white;
          color: #2C1F14;
          padding: 0.65rem 0.9rem;
          font-family: 'Jost', sans-serif;
          font-size: 0.88rem;
          outline: none;
          transition: border-color 0.2s;
          appearance: auto;
        }
        .form-field:focus { border-color: #C8A97A; }
      `}</style>
		</MainLayout>
	);
}
