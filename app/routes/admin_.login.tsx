import { json } from "@remix-run/node";
import type {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
} from "@remix-run/node";
import {
	Form,
	useActionData,
	useNavigation,
	useSearchParams,
} from "@remix-run/react";
import { login, createAdminSession } from "~/auth.server";

export const meta: MetaFunction = () => [
	{ title: "Admin Login — Tjiane Creations" },
];

export async function action({ request }: ActionFunctionArgs) {
	const form = await request.formData();
	const email = form.get("email") as string;
	const password = form.get("password") as string;
	const redirectTo = (form.get("redirectTo") as string) || "/admin";

	if (!email || !password) {
		return json(
			{ error: "Please enter your email and password." },
			{ status: 400 },
		);
	}

	const admin = await login(email, password);
	if (!admin) {
		return json({ error: "Invalid email or password." }, { status: 401 });
	}

	return createAdminSession(admin.id, redirectTo);
}

export default function AdminLogin() {
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	const [searchParams] = useSearchParams();
	const isSubmitting = navigation.state === "submitting";

	return (
		<div className="min-h-screen bg-bark flex items-center justify-center px-6">
			<div className="bg-cream-white p-8 w-full">
				<div className="flex flex-col justify-center items-center mb-8">
					<img className="w-28" src="/logo.png" />
					<p className="font-display italic text-tan text-2xl mb-1">
						Tjiane Creations
					</p>
					<p className="text-[0.65rem] tracking-widest uppercase text-bark">
						Admin Portal
					</p>
				</div>

				{actionData?.error && (
					<div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
						{actionData.error}
					</div>
				)}

				<Form method="post" className="space-y-5">
					<input
						type="hidden"
						name="redirectTo"
						value={searchParams.get("redirectTo") ?? "/admin"}
					/>

					<div>
						<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
							Email
						</label>
						<input
							name="email"
							type="email"
							required
							autoComplete="email"
							className="w-full border border-tan/40 bg-white text-bark px-4 py-2.5 text-sm outline-none focus:border-tan transition-colors"
						/>
					</div>

					<div>
						<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
							Password
						</label>
						<input
							name="password"
							type="password"
							required
							autoComplete="current-password"
							className="w-full border border-tan/40 bg-white text-bark px-4 py-2.5 text-sm outline-none focus:border-tan transition-colors"
						/>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full bg-accent text-cream py-3 text-[0.78rem] tracking-[0.15em] uppercase hover:bg-bark transition-colors cursor-pointer border-0 disabled:opacity-50"
					>
						{isSubmitting ? "Signing in…" : "Sign In"}
					</button>
				</Form>
			</div>
		</div>
	);
}
