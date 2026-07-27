import {
	json,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";

import "./tailwind.css";
import "./global.css";
import { getCart } from "~/cart.server";

import { pool } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const cart = await getCart(request);
	const [categories] = (await pool.query(
		`SELECT c.id, c.slug, c.name
   FROM categories c
   WHERE c.is_active = 1
   AND EXISTS (
     SELECT 1 FROM products p
     WHERE p.category_id = c.id
     AND p.is_active = 1
   )
   ORDER BY c.sort_order`,
	)) as any;
	return json({
		cartCount: cart.reduce((s, i) => s + i.quantity, 0),
		categories,
	});
}

export const links: LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}
