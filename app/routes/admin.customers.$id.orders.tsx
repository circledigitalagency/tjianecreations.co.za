import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { pool } from "~/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
	const [orders] = (await pool.query(
		`SELECT id, status, total_amount, shipping_method, created_at
     FROM orders
     WHERE customer_id = ?
     ORDER BY created_at DESC`,
		[params.id],
	)) as any;

	return json({ orders });
}
