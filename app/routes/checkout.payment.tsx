import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
	useLoaderData,
	Form,
	Link,
	useSearchParams,
	MetaFunction,
} from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { getCart, cartTotal, getSession } from "~/cart.server";

export const meta: MetaFunction = () => [
	{ title: "Checkout" },
	{
		name: "description",
		content:
			"The story behind Tjiane Creations — a one-woman leather craft studio in Brakpan, South Africa.",
	},
];

export async function loader({ request }: LoaderFunctionArgs) {
	const cart = await getCart(request);
	if (cart.length === 0) return redirect("/cart");

	const session = await getSession(request.headers.get("Cookie"));
	const checkout = session.get("checkout");
	if (!checkout) return redirect("/checkout");

	return json({ cart, total: cartTotal(cart), checkout });
}

export async function action({ request }: ActionFunctionArgs) {
	const session = await getSession(request.headers.get("Cookie"));
	const checkout = session.get("checkout");
	const cart = await getCart(request);
	const total = cartTotal(cart);

	if (!checkout || cart.length === 0) return redirect("/cart");

	const shippingCosts: Record<string, number> = {
		courier_guy: 120,
		postnet: 85,
		pep: 65,
	};
	const shippingCost = shippingCosts[checkout.shipping] ?? 0;
	const grandTotal = total + shippingCost;

	// Step 1 — create checkout WITHOUT successUrl to get the ID
	const yocoRes = await fetch("https://payments.yoco.com/api/checkouts", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
			"Content-Type": "application/json",
			"Idempotency-Key": `${checkout.email}-${Date.now()}`,
		},
		body: JSON.stringify({
			amount: Math.round(grandTotal * 100),
			currency: "ZAR",
			cancelUrl: `${process.env.APP_URL}/checkout/payment`,
			failureUrl: `${process.env.APP_URL}/checkout/payment?error=failed`,
			metadata: {
				customerName: checkout.name,
				customerEmail: checkout.email,
				customerPhone: checkout.phone,
				shippingAddress: `${checkout.address}, ${checkout.city}, ${checkout.province}, ${checkout.postal}`,
				shippingMethod: checkout.shipping,
				shippingCost: String(shippingCost),
				cart: JSON.stringify(cart),
			},
		}),
	});

	const yocoData = await yocoRes.json();
	console.log("Yoco response:", yocoData);

	if (!yocoData.id || !yocoData.redirectUrl) {
		console.error("Yoco error:", yocoData);
		return json(
			{
				error:
					yocoData.displayMessage ??
					"Could not initiate payment. Please try again.",
			},
			{ status: 400 },
		);
	}

	// Step 2 — now we have the ID, update the checkout with the correct successUrl
	await fetch(`https://payments.yoco.com/api/checkouts/${yocoData.id}`, {
		method: "PATCH",
		headers: {
			Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			successUrl: `${process.env.APP_URL}/checkout/success?checkoutId=${yocoData.id}`,
		}),
	});

	// Step 3 — redirect to Yoco
	return redirect(yocoData.redirectUrl);
}

export default function Payment() {
	const { cart, total, checkout } = useLoaderData<typeof loader>();
	const [searchParams] = useSearchParams();
	const error = searchParams.get("error");

	const shippingCosts: Record<string, number> = {
		courier_guy: 120,
		postnet: 85,
		pep: 65,
	};
	const shippingCost = shippingCosts[checkout.shipping] ?? 0;
	const grandTotal = total + shippingCost;

	return (
		<MainLayout>
			<div className="px-16 pt-16 pb-24 max-w-5xl mx-auto">
				{/* Steps */}
				<div className="flex items-center gap-3 mb-12 text-[0.72rem] tracking-[0.15em] uppercase">
					<span className="text-bark-mid/40">1. Your Details</span>
					<span className="text-bark-mid/30">——</span>
					<span className="text-accent font-medium">2. Payment</span>
					<span className="text-bark-mid/30">——</span>
					<span className="text-bark-mid/40">3. Confirmation</span>
				</div>

				{error && (
					<div className="mb-8 border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-4">
						<i className="ti ti-alert-circle text-red-500 text-xl shrink-0 mt-0.5" />
						<div>
							<p className="font-medium text-red-700 text-sm mb-1">
								{error === "payment_failed"
									? "Your payment was unsuccessful."
									: "Something went wrong with your payment."}
							</p>
							<p className="text-red-600/80 text-[0.82rem] leading-relaxed">
								No money has been taken from your account. Please check your
								card details and try again, or use a different payment method.
							</p>
						</div>
					</div>
				)}

				<div className="grid md:grid-cols-[1fr_320px] gap-12 items-start">
					<div>
						<h1 className="font-display font-light text-3xl text-bark mb-2">
							{error ? "Try Again" : "Review & Pay"}
						</h1>
						<p className="text-sm text-bark-mid mb-8">
							Paying as <strong>{checkout.name}</strong> · {checkout.email}
						</p>

						{/* Payment methods preview */}
						<div className="border border-tan/30 p-5 mb-8 bg-cream-white">
							<p className="text-[0.7rem] tracking-[0.2em] uppercase text-bark-mid mb-4">
								Accepted Payment Methods
							</p>
							<div className="flex gap-3 flex-wrap items-center">
								{["Visa", "Mastercard", "Apple Pay", "Google Pay"].map(
									(method) => (
										<span
											key={method}
											className="border border-tan/30 px-3 py-1.5 text-[0.72rem] text-bark-mid rounded"
										>
											{method}
										</span>
									),
								)}
							</div>
							<p className="text-[0.72rem] text-bark-mid/60 mt-3">
								You'll be securely redirected to Yoco to complete payment.
							</p>
						</div>

						{/* Confirm & pay */}
						<Form method="post">
							<button
								type="submit"
								className="bg-accent text-cream px-10 py-3.5 text-[0.8rem] tracking-[0.12em] uppercase hover:bg-bark transition-colors cursor-pointer border-0 w-full md:w-auto"
							>
								Pay R {grandTotal.toLocaleString("en-ZA")} Securely →
							</button>
						</Form>

						<Link
							to="/checkout"
							className="block mt-4 text-[0.72rem] tracking-[0.1em] uppercase text-bark-mid hover:text-accent transition-colors no-underline"
						>
							← Back to details
						</Link>
					</div>

					{/* Order summary */}
					<div className="bg-cream-white border border-tan/30 p-6 sticky top-24">
						<h2 className="font-display font-light text-xl text-bark mb-5">
							Order Summary
						</h2>

						<div className="space-y-3 mb-5 text-sm">
							{cart.map((item) => (
								<div
									key={`${item.productId}-${item.variantId}`}
									className="flex gap-3 items-center"
								>
									<div className="w-10 h-10 shrink-0 bg-gradient-to-br from-tan-light to-tan overflow-hidden">
										{item.imageUrl ? (
											<img
												src={item.imageUrl}
												alt={item.name}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-base opacity-30">
												👜
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-bark truncate">
											{item.name}
										</div>
										<div className="text-[0.68rem] text-bark-mid">
											Qty: {item.quantity}
										</div>
									</div>
									<div className="text-sm font-medium text-bark shrink-0">
										R {(item.price * item.quantity).toLocaleString("en-ZA")}
									</div>
								</div>
							))}
						</div>

						<div className="border-t border-tan/30 pt-4 space-y-2 text-sm">
							<div className="flex justify-between text-bark-mid">
								<span>Subtotal</span>
								<span>R {total.toLocaleString("en-ZA")}</span>
							</div>
							<div className="flex justify-between text-bark-mid">
								<span>Shipping</span>
								<span>R {shippingCost.toLocaleString("en-ZA")}</span>
							</div>
							<div className="flex justify-between font-semibold text-bark pt-2 border-t border-tan/20">
								<span className="font-display text-lg">Total</span>
								<span className="font-display text-lg">
									R {grandTotal.toLocaleString("en-ZA")}
								</span>
							</div>
						</div>

						<div className="mt-5 pt-4 border-t border-tan/20 text-[0.72rem] text-bark-mid space-y-0.5">
							<p className="font-medium text-bark">{checkout.name}</p>
							<p>{checkout.address}</p>
							<p>
								{checkout.city}, {checkout.postal}
							</p>
							<p className="capitalize pt-1">
								via {checkout.shipping.replace("_", " ")}
							</p>
						</div>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
