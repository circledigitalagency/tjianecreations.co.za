import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { requireAdmin } from "~/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const admin = await requireAdmin(request);
	return json({ admin });
}

export default function AdminRoot() {
	return <Outlet />;
}
