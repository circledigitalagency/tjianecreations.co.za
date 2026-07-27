import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { pool } from "~/db.server";

const { getSession, commitSession, destroySession } =
	createCookieSessionStorage({
		cookie: {
			name: "tjiane_admin",
			secrets: [process.env.SESSION_SECRET ?? "change-me"],
			sameSite: "lax",
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 8, // 8 hours
		},
	});

export async function login(email: string, password: string) {
	const [[admin]] = (await pool.query(
		"SELECT id, name, email, password_hash FROM admin_users WHERE email = ?",
		[email],
	)) as any;

	if (!admin) return null;

	const valid = await bcrypt.compare(password, admin.password_hash);
	if (!valid) return null;

	await pool.query("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [
		admin.id,
	]);

	return { id: admin.id, name: admin.name, email: admin.email };
}

export async function createAdminSession(adminId: number, redirectTo: string) {
	const session = await getSession();
	session.set("adminId", adminId);
	return redirect(redirectTo, {
		headers: { "Set-Cookie": await commitSession(session) },
	});
}

// Call at the top of every admin loader/action via the layout route
export async function requireAdmin(request: Request) {
	const session = await getSession(request.headers.get("Cookie"));
	const adminId = session.get("adminId");

	if (!adminId) {
		const url = new URL(request.url);
		throw redirect(
			`/admin/login?redirectTo=${encodeURIComponent(url.pathname)}`,
		);
	}

	const [[admin]] = (await pool.query(
		"SELECT id, name, email FROM admin_users WHERE id = ?",
		[adminId],
	)) as any;

	if (!admin) throw redirect("/admin/login");

	return admin;
}

export async function logout(request: Request) {
	const session = await getSession(request.headers.get("Cookie"));
	return redirect("/admin/login", {
		headers: { "Set-Cookie": await destroySession(session) },
	});
}
