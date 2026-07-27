import type { LoaderFunctionArgs } from "@remix-run/node";
import { pool } from "~/db.server";

// Whitelist of exportable tables with their queries.
// Never interpolate the table param directly into SQL.
const EXPORTS: Record<string, { filename: string; query: string }> = {
	products: {
		filename: "products",
		query: `
      SELECT p.id, p.name, p.slug, c.name AS category, lt.name AS leather_type,
             p.colours, p.base_price, p.is_new, p.is_customisable, p.is_active, p.created_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN leather_types lt ON p.leather_type_id = lt.id
      ORDER BY p.created_at DESC`,
	},
	orders: {
		filename: "orders",
		query: `
      SELECT o.id, cu.name AS customer_name, cu.email AS customer_email,
             o.status, o.total_amount, o.shipping_method, o.shipping_cost,
             o.shipping_address, o.tracking_number, o.yoco_charge_id, o.created_at
      FROM orders o
      JOIN customers cu ON o.customer_id = cu.id
      ORDER BY o.created_at DESC`,
	},
	customers: {
		filename: "customers",
		query: `
      SELECT c.id, c.name, c.email, c.phone,
             COUNT(o.id) AS total_orders,
             COALESCE(SUM(o.total_amount), 0) AS total_spent,
             c.created_at
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC`,
	},
	custom_orders: {
		filename: "custom-orders",
		query: `
      SELECT co.id, co.customer_name, co.customer_email, co.customer_phone,
             co.bag_style, lt.name AS leather_type, co.monogram_text,
             co.font_preference, co.special_instructions, co.quoted_total,
             co.deposit_amount, co.deposit_paid, co.status, co.created_at
      FROM custom_orders co
      LEFT JOIN leather_types lt ON co.leather_type_id = lt.id
      ORDER BY co.created_at DESC`,
	},
	corporate_enquiries: {
		filename: "corporate-enquiries",
		query: `
      SELECT id, company_name, contact_name, contact_email, contact_phone,
             quantity, bag_style, branding_notes, budget, status, created_at
      FROM corporate_enquiries
      ORDER BY created_at DESC`,
	},
};

function toCsv(rows: Record<string, unknown>[]): string {
	if (rows.length === 0) return "";

	const headers = Object.keys(rows[0]);

	const escape = (value: unknown): string => {
		if (value === null || value === undefined) return "";
		let str: string;
		if (value instanceof Date) {
			str = value.toISOString().slice(0, 19).replace("T", " ");
		} else {
			str = String(value);
		}
		// Escape quotes and wrap if the value contains commas, quotes or newlines
		if (/[",\n\r]/.test(str)) {
			str = `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	const lines = [
		headers.join(","),
		...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
	];

	return lines.join("\r\n");
}

export async function loader({ params }: LoaderFunctionArgs) {
	const table = params.table ?? "";
	const config = EXPORTS[table];

	if (!config) {
		throw new Response("Unknown export", { status: 404 });
	}

	const [rows] = (await pool.query(config.query)) as any;
	const csv = toCsv(rows as Record<string, unknown>[]);

	const date = new Date().toISOString().slice(0, 10);

	return new Response("\uFEFF" + csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="tjiane-${config.filename}-${date}.csv"`,
		},
	});
}
