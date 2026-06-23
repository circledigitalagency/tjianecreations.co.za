import { Link, NavLink } from "@remix-run/react";
import { useRouteLoaderData } from "@remix-run/react";
import { ShoppingCartIcon } from "lucide-react";

const navItems = [
	{ label: "Shop", to: "/shop" },
	{ label: "Custom Orders", to: "/custom" },
	{ label: "Corporate", to: "/corporate" },
	{ label: "About", to: "/about" },
];

export default function Header() {
	const root = useRouteLoaderData("root") as { cartCount: number };

	return (
		<nav className="fixed top-0 w-full z-50 flex items-center justify-between px-12 py-[1.4rem] bg-cream/[0.92] backdrop-blur-sm border-b border-tan/30">
			<Link to="/" className="flex items-center ">
				<img className="w-20 h-20" src="/logo.png" />
				<p className="font-display text-2xl font-semibold tracking-[0.05em] text-bark">
					Tjiane <span className="text-accent italic">Creations</span>
				</p>
			</Link>
			<ul className="hidden md:flex gap-10 list-none">
				{navItems.map(({ label, to }) => (
					<li key={to}>
						<NavLink
							to={to}
							className={({ isActive }) =>
								`text-nav no-underline transition-colors duration-200 ${
									isActive ? "text-accent" : "text-bark-mid hover:text-accent"
								}`
							}
						>
							{label}
						</NavLink>
					</li>
				))}
				<li>
					<Link
						to="/cart"
						className="relative text-bark-mid hover:text-accent transition-colors"
					>
						<ShoppingCartIcon />
						{root?.cartCount > 0 && (
							<span className="absolute -top-1.5 -right-1.5 bg-accent text-cream text-[0.6rem] w-4 h-4 rounded-full flex items-center justify-center font-medium">
								{root.cartCount}
							</span>
						)}
					</Link>
				</li>
				<li>
					<Link
						to="/shop"
						className="text-nav no-underline bg-bark text-cream-white px-[1.4rem] py-[0.55rem] rounded-sm transition-colors duration-200 hover:bg-accent"
					>
						Shop Now
					</Link>
				</li>
			</ul>
			{/* Mobile: hamburger placeholder */}
			<button className="md:hidden text-bark" aria-label="Open menu">
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<line x1="3" y1="6" x2="21" y2="6" />
					<line x1="3" y1="12" x2="21" y2="12" />
					<line x1="3" y1="18" x2="21" y2="18" />
				</svg>
			</button>
		</nav>
	);
}
