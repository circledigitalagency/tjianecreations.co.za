import { useEffect, useState } from "react";
import {
	Link,
	NavLink,
	useLocation,
	useRouteLoaderData,
} from "@remix-run/react";
import { ChevronDown, ShoppingCartIcon } from "lucide-react";

interface Category {
	id: number;
	slug: string;
	name: string;
	parent_id: number | null;
}

const navItems = [
	{ label: "Custom Orders", to: "/custom" },
	{ label: "Corporate", to: "/corporate" },
	{ label: "Repairs", to: "/repairs" },
	{ label: "About", to: "/about" },
];

export default function Header() {
	const [shopOpen, setShopOpen] = useState(false);
	const rootData = useRouteLoaderData("root") as
		| { categories: Category[] }
		| undefined;
	const categories = rootData?.categories ?? [];
	const root = useRouteLoaderData("root") as { cartCount: number };
	const [mobileOpen, setMobileOpen] = useState(false);

	const location = useLocation();
	useEffect(() => {
		setMobileOpen(false);
	}, [location.pathname]);

	const shopGroups = [
		{
			label: "Shop",
			items: categories.map((c: any) => ({
				label: c.name,
				to: `/shop?category=${c.slug}`,
			})),
		},
	];

	return (
		<>
			<nav className="fixed top-0 w-full z-50 flex items-center justify-between px-12 py-[1.4rem] bg-cream/[0.92] backdrop-blur-sm border-b border-tan/30">
				<Link
					to="/"
					className="font-display text-2xl font-semibold tracking-[0.05em] text-bark"
				>
					Tjiane <span className="text-accent italic">Creations</span>
				</Link>

				<ul className="hidden md:flex gap-8 list-none items-center">
					{/* Shop dropdown */}
					<li
						className="relative"
						onMouseEnter={() => setShopOpen(true)}
						onMouseLeave={() => setShopOpen(false)}
					>
						<button className="flex items-center gap-1.5 text-nav text-bark-mid hover:text-accent transition-colors duration-200 bg-transparent border-0 cursor-pointer py-2">
							Shop
							<ChevronDown
								size={13}
								className={`transition-transform duration-200 ${
									shopOpen ? "rotate-180" : ""
								}`}
							/>
						</button>

						{shopOpen && (
							<div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[560px]">
								<div className="bg-cream-white border border-tan/30 shadow-lg p-6 grid grid-cols-3 gap-6">
									{shopGroups.map((group) => (
										<div key={group.label}>
											<p className="text-[0.68rem] tracking-[0.15em] uppercase text-tan-dark mb-3 font-medium">
												{group.label}
											</p>
											<ul className="flex flex-col gap-2">
												{group.items.map((item) => (
													<li key={item.to}>
														<Link
															to={item.to}
															className="text-[0.82rem] text-bark-mid hover:text-accent no-underline transition-colors block"
														>
															{item.label}
														</Link>
													</li>
												))}
											</ul>
										</div>
									))}
								</div>

								{/* View all link spanning the bottom */}
								<div className="bg-cream-white border-t border-tan/20 px-6 py-3">
									<Link
										to="/shop"
										className="text-[0.75rem] text-accent hover:underline no-underline"
									>
										View All Products →
									</Link>
								</div>
							</div>
						)}
					</li>

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

				{/* Mobile hamburger — unchanged */}
				<button
					className="md:hidden text-bark"
					aria-label="Open menu"
					onClick={() => setMobileOpen(!mobileOpen)}
				>
					{mobileOpen ? (
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<line x1="3" y1="3" x2="21" y2="21" />
							<line x1="21" y1="3" x2="3" y2="21" />
						</svg>
					) : (
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
					)}
				</button>
			</nav>

			{mobileOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-40 bg-bark/40 md:hidden"
						onClick={() => setMobileOpen(false)}
					/>

					{/* Drawer */}
					<div className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-cream-white shadow-xl md:hidden flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-5 border-b border-tan/20">
							<span className="font-display text-lg font-semibold text-bark">
								Menu
							</span>
							<button
								onClick={() => setMobileOpen(false)}
								className="text-bark-mid hover:text-bark bg-transparent border-0 cursor-pointer"
								aria-label="Close menu"
							>
								<svg
									width="22"
									height="22"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<line x1="3" y1="3" x2="21" y2="21" />
									<line x1="21" y1="3" x2="3" y2="21" />
								</svg>
							</button>
						</div>

						{/* Links */}
						<div className="flex-1 overflow-y-auto px-6 py-6">
							{/* Shop — grouped */}
							<div className="mb-6">
								<p className="text-[0.65rem] tracking-[0.2em] uppercase text-tan-dark mb-3">
									Shop
								</p>
								{shopGroups.map((group) => (
									<div key={group.label} className="mb-4">
										<p className="text-[0.68rem] tracking-[0.12em] uppercase text-bark-mid mb-2">
											{group.label}
										</p>
										{group.items.map((item) => (
											<Link
												key={item.to}
												to={item.to}
												className="block py-1.5 text-[0.88rem] text-bark no-underline hover:text-accent transition-colors"
											>
												{item.label}
											</Link>
										))}
									</div>
								))}
							</div>

							{/* Divider */}
							<div className="border-t border-tan/20 mb-6" />

							{/* Other nav links */}
							{navItems.map(({ label, to }) => (
								<NavLink
									key={to}
									to={to}
									className={({ isActive }) =>
										`block py-2 text-[0.88rem] no-underline transition-colors ${
											isActive ? "text-accent" : "text-bark hover:text-accent"
										}`
									}
								>
									{label}
								</NavLink>
							))}

							{/* Divider */}
							<div className="border-t border-tan/20 mt-4 mb-6" />

							{/* Shop now CTA */}
							<Link
								to="/shop"
								className="block text-center bg-bark text-cream-white px-6 py-3 text-[0.78rem] tracking-[0.12em] uppercase no-underline hover:bg-accent transition-colors"
							>
								Shop Now
							</Link>
						</div>
					</div>
				</>
			)}
		</>
	);
}
