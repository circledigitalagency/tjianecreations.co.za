import { Link, NavLink, Form } from "@remix-run/react";
import {
	LayoutDashboard,
	Package,
	ShoppingCart,
	Pencil,
	Users,
	LogOut,
} from "lucide-react";

import { Building2 } from "lucide-react"; // add to imports

const navItems = [
	{ label: "Dashboard", to: "/admin", icon: LayoutDashboard },
	{ label: "Products", to: "/admin/products", icon: Package },
	{ label: "Orders", to: "/admin/orders", icon: ShoppingCart },
	{ label: "Customers", to: "/admin/customers", icon: Users },
	{ label: "Custom Orders", to: "/admin/custom-orders", icon: Pencil },
	{
		label: "Corporate Enquiries",
		to: "/admin/corporate-enquiries",
		icon: Building2,
	},
];

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen bg-gray-50">
			{/* Sidebar */}
			<aside className="w-56 bg-bark text-cream flex flex-col shrink-0">
				<div className="px-6 py-5 border-b border-tan/20">
					<img className="w-3/4" src="/logo.png" />
					<Link to="/" className="font-display italic text-tan text-lg">
						Tjiane Creations
					</Link>
					<p className="text-[0.65rem] tracking-widest uppercase text-cream/40 mt-0.5">
						Admin Portal
					</p>
				</div>

				<nav className="flex-1 px-3 py-4 flex flex-col gap-1">
					{navItems.map(({ label, to, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							end={to === "/admin"}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3 py-2 rounded text-[0.82rem] transition-colors ${
									isActive
										? "bg-tan/20 text-tan"
										: "text-cream/60 hover:text-cream hover:bg-white/5"
								}`
							}
						>
							<Icon size={15} />
							{label}
						</NavLink>
					))}
				</nav>

				<div className="px-3 py-4 border-t border-tan/20">
					<Form method="post" action="/admin/logout">
						<button className="flex items-center gap-3 px-3 py-2 w-full text-[0.82rem] text-cream/40 hover:text-cream transition-colors cursor-pointer border-0 bg-transparent">
							<i className="ti ti-logout text-base" />
							Log out
						</button>
					</Form>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 flex flex-col overflow-auto">
				<div className="p-8">{children}</div>
			</main>
		</div>
	);
}
