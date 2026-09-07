import { createCookieSessionStorage } from "@remix-run/node";

// Session storage — keep this secret in .env
const { getSession, commitSession, destroySession } =
	createCookieSessionStorage({
		cookie: {
			name: "tjiane_cart",
			secrets: [process.env.SESSION_SECRET ?? "tjiane-secret-change-me"],
			sameSite: "lax",
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 24 * 7, // 7 days
		},
	});

export interface CartItem {
	productId: number;
	variantId: number | null;
	name: string;
	price: number;
	quantity: number;
	imageUrl: string | null;
	colour: string | null;
	size: string | null;
	customisationText: string | null;
}

export async function getCart(request: Request): Promise<CartItem[]> {
	const session = await getSession(request.headers.get("Cookie"));
	return session.get("cart") ?? [];
}

export async function addToCart(
	request: Request,
	item: CartItem,
): Promise<Response> {
	const session = await getSession(request.headers.get("Cookie"));
	const cart: CartItem[] = session.get("cart") ?? [];

	// If same product + variant already in cart, increment qty
	const existing = cart.findIndex(
		(i) => i.productId === item.productId && i.variantId === item.variantId,
	);

	if (existing > -1) {
		cart[existing].quantity += item.quantity;
	} else {
		cart.push(item);
	}

	session.set("cart", cart);

	return new Response(null, {
		status: 204,
		headers: { "Set-Cookie": await commitSession(session) },
	});
}

export async function updateCartItem(
	request: Request,
	productId: number,
	variantId: number | null,
	quantity: number,
): Promise<Response> {
	const session = await getSession(request.headers.get("Cookie"));
	let cart: CartItem[] = session.get("cart") ?? [];

	if (quantity <= 0) {
		// Remove item
		cart = cart.filter(
			(i) => !(i.productId === productId && i.variantId === variantId),
		);
	} else {
		const idx = cart.findIndex(
			(i) => i.productId === productId && i.variantId === variantId,
		);
		if (idx > -1) cart[idx].quantity = quantity;
	}

	session.set("cart", cart);

	return new Response(null, {
		status: 204,
		headers: { "Set-Cookie": await commitSession(session) },
	});
}

export async function clearCart(request: Request): Promise<string> {
	const session = await getSession(request.headers.get("Cookie"));
	session.set("cart", []);
	return commitSession(session);
}

export function cartTotal(cart: CartItem[]): number {
	return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export { getSession, commitSession, destroySession };
