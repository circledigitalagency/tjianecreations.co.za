import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { addToCart } from "~/cart.server";
import { pool } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();

	const productId = parseInt(form.get("productId") as string);
	const variantId = form.get("variantId")
		? parseInt(form.get("variantId") as string)
		: null;
	const redirectTo = (form.get("redirectTo") as string) ?? "/shop";

	// Fetch product details to store in cart
	const [[product]] = (await pool.query(
		`SELECT p.id, p.name, p.base_price, p.slug,
      (SELECT url FROM product_images pi
       WHERE pi.product_id = p.id
       ORDER BY pi.sort_order LIMIT 1) AS image_url
     FROM products p WHERE p.id = ?`,
		[productId],
	)) as any;

	if (!product) throw new Response("Product not found", { status: 404 });

	// Get variant details if provided
	let price = Number(product.base_price);
	let colour = null;
	let size = null;

	if (variantId) {
		const [[variant]] = (await pool.query(
			`SELECT pv.price_delta, c.name AS colour, s.label AS size
       FROM product_variants pv
       LEFT JOIN colours c ON pv.colour_id = c.id
       LEFT JOIN sizes s ON pv.size_id = s.id
       WHERE pv.id = ?`,
			[variantId],
		)) as any;

		if (variant) {
			price += Number(variant.price_delta);
			colour = variant.colour;
			size = variant.size;
		}
	}

	const response = await addToCart(request, {
		productId,
		variantId,
		name: product.name,
		price,
		quantity: 1,
		imageUrl: product.image_url,
		colour,
		size,
	});

	// Redirect back with the Set-Cookie header from addToCart
	return redirect(redirectTo, {
		headers: { "Set-Cookie": response.headers.get("Set-Cookie")! },
	});
}
