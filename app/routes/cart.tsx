import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { getCart, updateCartItem, cartTotal } from "~/cart.server";
import { commitSession, getSession } from "~/cart.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const cart = await getCart(request);
	return json({ cart, total: cartTotal(cart) });
}

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();
	const _action = form.get("_action") as string;
	const productId = parseInt(form.get("productId") as string);
	const variantId = form.get("variantId")
		? parseInt(form.get("variantId") as string)
		: null;

	if (_action === "update") {
		const quantity = parseInt(form.get("quantity") as string);
		const response = await updateCartItem(
			request,
			productId,
			variantId,
			quantity,
		);
		return redirect("/cart", {
			headers: { "Set-Cookie": response.headers.get("Set-Cookie")! },
		});
	}

	if (_action === "remove") {
		const response = await updateCartItem(request, productId, variantId, 0);
		return redirect("/cart", {
			headers: { "Set-Cookie": response.headers.get("Set-Cookie")! },
		});
	}

	return null;
}

export default function CartPage() {
	const { cart, total } = useLoaderData<typeof loader>();

	return (
		<MainLayout>
			<div className="px-16 pt-16 pb-24 max-w-5xl mx-auto">
				<h1 className="font-display font-light text-[clamp(2rem,3vw,3rem)] text-bark mb-12">
					Your <em className="italic text-accent">Cart</em>
				</h1>

				{cart.length === 0 ? (
					<div className="text-center py-24">
						<p className="font-display italic text-2xl text-bark-mid mb-6">
							Your cart is empty.
						</p>
						<Link
							to="/shop"
							className="bg-accent text-cream px-9 py-3 text-[0.8rem] tracking-[0.12em] uppercase no-underline hover:bg-bark transition-colors"
						>
							Browse the Shop
						</Link>
					</div>
				) : (
					<div className="grid md:grid-cols-[1fr_320px] gap-12 items-start">
						{/* Line items */}
						<div className="divide-y divide-tan/20">
							{cart.map((item) => (
								<div
									key={`${item.productId}-${item.variantId}`}
									className="py-6 flex gap-5"
								>
									{/* Image */}
									<div className="w-24 h-24 shrink-0 bg-gradient-to-br from-tan-light to-tan overflow-hidden">
										{item.imageUrl ? (
											<img
												src={item.imageUrl}
												alt={item.name}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
												👜
											</div>
										)}
									</div>

									{/* Details */}
									<div className="flex-1">
										<div className="font-display font-semibold text-[1.1rem] text-bark mb-0.5">
											{item.name}
										</div>
										{(item.colour || item.size) && (
											<div className="text-[0.72rem] tracking-[0.1em] uppercase text-bark-mid mb-3">
												{[item.colour, item.size].filter(Boolean).join(" · ")}
											</div>
										)}

										<div className="flex items-center gap-4">
											{/* Qty update form */}
											<Form method="post" className="flex items-center gap-2">
												<input type="hidden" name="_action" value="update" />
												<input
													type="hidden"
													name="productId"
													value={item.productId}
												/>
												<input
													type="hidden"
													name="variantId"
													value={item.variantId ?? ""}
												/>
												<button
													type="submit"
													name="quantity"
													value={item.quantity - 1}
													className="w-7 h-7 border border-tan/40 text-bark-mid hover:border-tan transition-colors cursor-pointer bg-transparent text-sm"
												>
													−
												</button>
												<span className="w-6 text-center text-sm font-medium text-bark">
													{item.quantity}
												</span>
												<button
													type="submit"
													name="quantity"
													value={item.quantity + 1}
													className="w-7 h-7 border border-tan/40 text-bark-mid hover:border-tan transition-colors cursor-pointer bg-transparent text-sm"
												>
													+
												</button>
											</Form>

											{/* Remove */}
											<Form method="post">
												<input type="hidden" name="_action" value="remove" />
												<input
													type="hidden"
													name="productId"
													value={item.productId}
												/>
												<input
													type="hidden"
													name="variantId"
													value={item.variantId ?? ""}
												/>
												<button
													type="submit"
													className="text-[0.72rem] tracking-[0.1em] uppercase text-bark-mid/60 hover:text-accent transition-colors cursor-pointer border-0 bg-transparent"
												>
													Remove
												</button>
											</Form>
										</div>
									</div>

									{/* Price */}
									<div className="font-display font-semibold text-[1.1rem] text-bark shrink-0">
										R {(item.price * item.quantity).toLocaleString("en-ZA")}
									</div>
								</div>
							))}
						</div>

						{/* Order summary */}
						<div className="bg-cream-white border border-tan/30 p-6 sticky top-24">
							<h2 className="font-display font-light text-xl text-bark mb-6">
								Order Summary
							</h2>

							<div className="space-y-3 text-sm mb-6">
								<div className="flex justify-between text-bark-mid">
									<span>
										Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)
									</span>
									<span>R {total.toLocaleString("en-ZA")}</span>
								</div>
								<div className="flex justify-between text-bark-mid">
									<span>Shipping</span>
									<span className="text-bark-mid/60 italic">
										Calculated at checkout
									</span>
								</div>
								<div className="border-t border-tan/30 pt-3 flex justify-between font-semibold text-bark">
									<span className="font-display text-lg">Total</span>
									<span className="font-display text-lg">
										R {total.toLocaleString("en-ZA")}
									</span>
								</div>
							</div>

							<Link
								to="/checkout"
								className="block w-full bg-accent text-cream text-center py-3 text-[0.8rem] tracking-[0.12em] uppercase no-underline hover:bg-bark transition-colors"
							>
								Proceed to Checkout
							</Link>

							<Link
								to="/shop"
								className="block w-full text-center mt-3 text-[0.72rem] tracking-[0.1em] uppercase text-bark-mid no-underline hover:text-accent transition-colors"
							>
								Continue Shopping
							</Link>
						</div>
					</div>
				)}
			</div>
		</MainLayout>
	);
}
