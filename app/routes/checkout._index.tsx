import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { getCart, cartTotal, getSession, commitSession } from "~/cart.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const cart = await getCart(request);
	if (cart.length === 0) return redirect("/cart");
	return json({ cart, total: cartTotal(cart) });
}

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();

	const name = form.get("name") as string;
	const email = form.get("email") as string;
	const phone = form.get("phone") as string;
	const address = form.get("address") as string;
	const city = form.get("city") as string;
	const province = form.get("province") as string;
	const postal = form.get("postal") as string;
	const shipping = form.get("shipping") as string;

	if (!name || !email || !address || !city || !postal) {
		return json(
			{ error: "Please fill in all required fields." },
			{ status: 400 },
		);
	}

	// Store customer details in session for payment step
	const session = await getSession(request.headers.get("Cookie"));
	session.set("checkout", {
		name,
		email,
		phone,
		address,
		city,
		province,
		postal,
		shipping,
	});

	return redirect("/checkout/payment", {
		headers: { "Set-Cookie": await commitSession(session) },
	});
}

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

export default function Checkout() {
	const { cart, total } = useLoaderData<typeof loader>();

	return (
		<MainLayout>
			<div className="px-16 pt-16 pb-24 max-w-5xl mx-auto">
				{/* Steps indicator */}
				<div className="flex items-center gap-3 mb-12 text-[0.72rem] tracking-[0.15em] uppercase">
					<span className="text-accent font-medium">1. Your Details</span>
					<span className="text-bark-mid/30">——</span>
					<span className="text-bark-mid/40">2. Payment</span>
					<span className="text-bark-mid/30">——</span>
					<span className="text-bark-mid/40">3. Confirmation</span>
				</div>

				<div className="grid md:grid-cols-[1fr_320px] gap-12 items-start">
					{/* Form */}
					<div>
						<h1 className="font-display font-light text-3xl text-bark mb-8">
							Your Details
						</h1>

						<Form method="post" className="space-y-5">
							<div className="grid grid-cols-2 gap-4">
								<Field label="Full Name *">
									<input
										name="name"
										type="text"
										required
										className="field"
										placeholder="Jane Smith"
									/>
								</Field>
								<Field label="Email *">
									<input
										name="email"
										type="email"
										required
										className="field"
										placeholder="jane@email.com"
									/>
								</Field>
							</div>

							<Field label="Phone Number">
								<input
									name="phone"
									type="tel"
									className="field"
									placeholder="+27 82 000 0000"
								/>
							</Field>

							<div className="pt-2 pb-1">
								<p className="text-[0.72rem] tracking-[0.2em] uppercase text-tan-dark mb-4">
									Delivery Address
								</p>
							</div>

							<Field label="Street Address *">
								<input
									name="address"
									type="text"
									required
									className="field"
									placeholder="12 Main Road"
								/>
							</Field>

							<div className="grid grid-cols-2 gap-4">
								<Field label="City *">
									<input
										name="city"
										type="text"
										required
										className="field"
										placeholder="Johannesburg"
									/>
								</Field>
								<Field label="Postal Code *">
									<input
										name="postal"
										type="text"
										required
										className="field"
										placeholder="1540"
									/>
								</Field>
							</div>

							<Field label="Province">
								<select name="province" className="field">
									{provinces.map((p) => (
										<option key={p}>{p}</option>
									))}
								</select>
							</Field>

							<div className="pt-2 pb-1">
								<p className="text-[0.72rem] tracking-[0.2em] uppercase text-tan-dark mb-4">
									Shipping Method
								</p>
							</div>

							<div className="space-y-3">
								{[
									{
										value: "courier_guy",
										label: "The Courier Guy",
										detail: "3–5 business days · R 120",
									},
								].map((opt) => (
									<label
										key={opt.value}
										className="flex items-center gap-4 border border-tan/30 px-4 py-3 cursor-pointer hover:border-tan transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5"
									>
										<input
											type="radio"
											name="shipping"
											value={opt.value}
											defaultChecked={opt.value === "courier_guy"}
											className="accent-accent"
										/>
										<div>
											<div className="text-sm font-medium text-bark">
												{opt.label}
											</div>
											<div className="text-[0.75rem] text-bark-mid">
												{opt.detail}
											</div>
										</div>
									</label>
								))}
							</div>

							<div className="flex gap-4 pt-4">
								<button
									type="submit"
									className="bg-accent text-cream px-10 py-3 text-[0.8rem] tracking-[0.12em] uppercase hover:bg-bark transition-colors cursor-pointer border-0"
								>
									Continue to Payment
								</button>
								<Link
									to="/cart"
									className="px-8 py-3 text-[0.8rem] tracking-[0.12em] uppercase border border-bark-mid text-bark-mid hover:bg-bark-mid hover:text-cream transition-colors no-underline"
								>
									Back to Cart
								</Link>
							</div>
						</Form>

						<style>{`
              .field {
                width: 100%;
                border: 1px solid #d4b896;
                background: white;
                color: #2C1F14;
                padding: 0.6rem 0.85rem;
                font-family: 'Jost', sans-serif;
                font-size: 0.88rem;
                outline: none;
                border-radius: 2px;
                transition: border-color 0.2s;
              }
              .field:focus { border-color: #C8A97A; }
            `}</style>
					</div>

					{/* Order summary sidebar */}
					<div className="bg-cream-white border border-tan/30 p-6 sticky top-24">
						<h2 className="font-display font-light text-xl text-bark mb-5">
							Order Summary
						</h2>
						<div className="space-y-4 mb-6">
							{cart.map((item) => (
								<div
									key={`${item.productId}-${item.variantId}`}
									className="flex gap-3 items-center"
								>
									<div className="w-12 h-12 shrink-0 bg-gradient-to-br from-tan-light to-tan overflow-hidden">
										{item.imageUrl ? (
											<img
												src={item.imageUrl}
												alt={item.name}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-lg opacity-30">
												👜
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-bark truncate">
											{item.name}
										</div>
										{(item.colour || item.size) && (
											<div className="text-[0.68rem] text-bark-mid uppercase tracking-wide">
												{[item.colour, item.size].filter(Boolean).join(" · ")}
											</div>
										)}
										<div className="text-[0.72rem] text-bark-mid">
											Qty: {item.quantity}
										</div>
									</div>
									<div className="text-sm font-medium text-bark shrink-0">
										R {(item.price * item.quantity).toLocaleString("en-ZA")}
									</div>
								</div>
							))}
						</div>
						<div className="border-t border-tan/30 pt-4 flex justify-between">
							<span className="font-display text-lg text-bark">Total</span>
							<span className="font-display text-lg font-semibold text-bark">
								R {total.toLocaleString("en-ZA")}
							</span>
						</div>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label className="block text-[0.72rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
				{label}
			</label>
			{children}
		</div>
	);
}
