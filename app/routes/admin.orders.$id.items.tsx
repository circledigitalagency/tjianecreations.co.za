import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { pool } from "~/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
	const [items] = (await pool.query(
		`SELECT
    oi.id,
    oi.quantity,
    oi.unit_price,
    p.name AS product_name,
    oi.customisation_text AS colour,
    (SELECT url FROM product_images pi
     WHERE pi.product_id = p.id
     ORDER BY pi.sort_order LIMIT 1) AS image_url
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = ?`,
		[params.id],
	)) as any;

	return json({ items });
}
