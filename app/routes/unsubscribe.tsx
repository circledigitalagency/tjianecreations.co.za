import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";
import { pool } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	if (!token) return json({ success: false });

	const [result] = (await pool.query(
		"UPDATE customers SET marketing_opt_in = 0 WHERE unsubscribe_token = ?",
		[token],
	)) as any;

	return json({ success: result.affectedRows > 0 });
}

export default function Unsubscribe() {
	const { success } = useLoaderData<typeof loader>();

	return (
		<MainLayout>
			<div className="px-16 py-32 max-w-md mx-auto text-center">
				<h1 className="font-display font-light text-3xl text-bark mb-4">
					{success ? "You're unsubscribed" : "Link not recognised"}
				</h1>
				<p className="text-bark-mid font-light mb-8">
					{success
						? "You won't receive new drop emails from us anymore."
						: "This unsubscribe link is invalid or has already been used."}
				</p>
				<Link
					to="/shop"
					className="text-[0.78rem] tracking-[0.1em] uppercase text-accent border-b border-accent pb-0.5 no-underline"
				>
					Back to the shop
				</Link>
			</div>
		</MainLayout>
	);
}
