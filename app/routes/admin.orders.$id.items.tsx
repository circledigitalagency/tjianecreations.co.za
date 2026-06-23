import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { pool } from "~/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
	const [items] = (await pool.query(
		`SELECT
      oi.id,
      oi.quantity,
      oi.unit_price,
      p.name  AS product_name,
      c.name  AS colour,
      s.label AS size
    FROM order_items oi
    JOIN product_variants pv ON oi.product_variant_id = pv.id
    JOIN products p          ON pv.product_id = p.id
    LEFT JOIN colours c      ON pv.colour_id = c.id
    LEFT JOIN sizes s        ON pv.size_id = s.id
    WHERE oi.order_id = ?`,
		[params.id],
	)) as any;

	return json({ items });
}
