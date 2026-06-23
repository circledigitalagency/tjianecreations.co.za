import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, MetaFunction } from "@remix-run/react";
import { CartItem, getSession, commitSession } from "~/cart.server";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";

export const meta: MetaFunction = () => [
	{ title: "Payment Successful" },
	{
		name: "description",
		content:
			"The story behind Tjiane Creations — a one-woman leather craft studio in Brakpan, South Africa.",
	},
];

export async function loader({ request }: LoaderFunctionArgs) {
	console.log("✅ Success page hit:", request.url);

	const url = new URL(request.url);
	const checkoutId = url.searchParams.get("checkoutId");
	console.log("Yoco checkout ID from URL:", checkoutId);

	if (!checkoutId) return redirect("/");

	// 1. Verify with Yoco FIRST
	const yocoRes = await fetch(
		`https://payments.yoco.com/api/checkouts/${checkoutId}`,
		{
			headers: {
				Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
			},
		},
	);

	const yocoData = await yocoRes.json();
	console.log("Yoco status:", yocoData.status, yocoData);

	const validStatuses = [
		"completed",
		"complete",
		"payment_initiated",
		"created",
	];
	if (!validStatuses.includes(yocoData.status)) {
		return redirect("/checkout/payment?error=payment_failed");
	}

	// 2. Get session data
	const session = await getSession(request.headers.get("Cookie"));
	const checkout = session.get("checkout");
	const cart: CartItem[] = session.get("cart") ?? [];

	// 3. Save customer
	const [existing] = (await pool.query(
		"SELECT id FROM customers WHERE email = ?",
		[checkout?.email ?? yocoData.metadata?.customerEmail],
	)) as any;

	let customerId: number;
	if ((existing as any[]).length > 0) {
		customerId = existing[0].id;
	} else {
		const [result] = (await pool.query(
			"INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
			[
				checkout?.name ?? yocoData.metadata?.customerName,
				checkout?.email ?? yocoData.metadata?.customerEmail,
				checkout?.phone ?? yocoData.metadata?.customerPhone,
			],
		)) as any;
		customerId = result.insertId;
	}

	// 4. Prevent duplicate orders on refresh
	const [existingOrder] = (await pool.query(
		"SELECT id FROM orders WHERE yoco_charge_id = ?",
		[checkoutId],
	)) as any;

	let orderId: number;

	if ((existingOrder as any[]).length > 0) {
		orderId = existingOrder[0].id;
	} else {
		// 5. Save order
		const shippingCosts: Record<string, number> = {
			courier_guy: 120,
			postnet: 85,
			pep: 65,
		};
		const shippingMethod =
			checkout?.shipping ?? yocoData.metadata?.shippingMethod;
		const shippingCost = shippingCosts[shippingMethod] ?? 0;
		const shippingAddress = checkout
			? `${checkout.address}, ${checkout.city}, ${checkout.province}, ${checkout.postal}`
			: yocoData.metadata?.shippingAddress;

		const [orderResult] = (await pool.query(
			`INSERT INTO orders
        (customer_id, status, total_amount, shipping_method, shipping_cost, shipping_address, yoco_charge_id)
       VALUES (?, 'paid', ?, ?, ?, ?, ?)`,
			[
				customerId,
				yocoData.amount / 100,
				shippingMethod,
				shippingCost,
				shippingAddress,
				checkoutId,
			],
		)) as any;

		orderId = orderResult.insertId;

		// 6. Save order items
		// Save order items
		for (const item of cart) {
			await pool.query(
				`INSERT INTO order_items (order_id, product_id, product_variant_id, quantity, unit_price)
     VALUES (?, ?, ?, ?, ?)`,
				[
					orderId,
					item.productId,
					item.variantId ?? null,
					item.quantity,
					item.price,
				],
			);

			// Only decrement stock if there's a variant
			if (item.variantId) {
				await pool.query(
					"UPDATE product_variants SET stock_qty = stock_qty - ? WHERE id = ?",
					[item.quantity, item.variantId],
				);
			}
		}
	}

	// 7. Clear session
	session.set("cart", []);
	session.unset("checkout");
	session.unset("yocoCheckoutId");

	return json(
		{
			order: {
				id: orderId,
				total: yocoData.amount / 100,
				customerName: checkout?.name ?? yocoData.metadata?.customerName,
				email: checkout?.email ?? yocoData.metadata?.customerEmail,
				shippingMethod: checkout?.shipping ?? yocoData.metadata?.shippingMethod,
			},
		},
		{ headers: { "Set-Cookie": await commitSession(session) } },
	);
}

export default function Success() {
	const { order } = useLoaderData<typeof loader>();

	return (
		<MainLayout>
			<div className="px-16 pt-24 pb-32 max-w-2xl mx-auto text-center">
				<div className="text-5xl mb-6">🎉</div>
				<h1 className="font-display font-light text-[clamp(2rem,4vw,3.5rem)] text-bark mb-4">
					Order <em className="italic text-accent">Confirmed</em>
				</h1>
				<p className="text-bark-mid font-light leading-relaxed mb-10">
					Thank you, {order.customerName}. Your order #{order.id} has been
					placed and a confirmation will be sent to {order.email}.
				</p>

				<div className="bg-cream-white border border-tan/30 p-6 text-left mb-10">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1">
								Order number
							</p>
							<p className="font-medium text-bark">#{order.id}</p>
						</div>
						<div>
							<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1">
								Total paid
							</p>
							<p className="font-medium text-bark">
								R {Number(order.total).toLocaleString("en-ZA")}
							</p>
						</div>
						<div>
							<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1">
								Shipping via
							</p>
							<p className="font-medium text-bark capitalize">
								{order.shippingMethod.replace("_", " ")}
							</p>
						</div>
					</div>
				</div>

				<div className="flex gap-4 justify-center">
					<Link
						to="/shop"
						className="bg-accent text-cream px-9 py-3 text-[0.8rem] tracking-[0.12em] uppercase no-underline hover:bg-bark transition-colors"
					>
						Continue Shopping
					</Link>
				</div>
			</div>
		</MainLayout>
	);
}
