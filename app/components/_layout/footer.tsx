import { Link } from "@remix-run/react";

const shopLinks = [
	{ label: "All Products", to: "/shop" },
	{ label: "Tote Bags", to: "/shop?category=totes" },
	{ label: "Clutches", to: "/shop?category=clutches" },
	{ label: "Crossbody", to: "/shop?category=crossbody" },
];

const serviceLinks = [
	{ label: "Custom Orders", to: "/custom" },
	{ label: "Corporate Gifting", to: "/corporate" },
	{ label: "Repairs & Care", to: "/repairs" },
];

const infoLinks = [
	{ label: "About", to: "/about" },
	{ label: "Shipping & Returns", to: "/shipping" },
	{ label: "FAQ", to: "/faq" },
	{ label: "Review", to: "/review" },
];

function FooterColumn({
	heading,
	links,
}: {
	heading: string;
	links: { label: string; to: string }[];
}) {
	return (
		<div>
			<h4 className="text-[0.7rem] tracking-[0.2em] uppercase text-tan mb-5">
				{heading}
			</h4>
			<ul className="flex flex-col gap-2.5 list-none">
				{links.map(({ label, to }) => (
					<li key={to}>
						<Link
							to={to}
							className="text-cream-white/60 no-underline text-[0.82rem] transition-colors duration-200 hover:text-tan"
						>
							{label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

export default function Footer() {
	return (
		<>
			<footer className="bg-bark text-cream-white/60 px-16 py-12 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12">
				{/* Brand */}
				<div>
					<Link
						to="/"
						className="font-display text-[1.3rem] font-semibold tracking-[0.05em] text-cream-white mb-4 block"
					>
						Tjiane <span className="text-tan italic">Creations</span>
					</Link>
					<p className="text-[0.82rem] leading-[1.8] font-light">
						Handcrafted genuine leather bags, made with love in Brakpan, South
						Africa.
						<br />
						Available online. Delivered nationwide.
					</p>
				</div>

				<FooterColumn heading="Shop" links={shopLinks} />
				<FooterColumn heading="Services" links={serviceLinks} />
				<FooterColumn heading="Info" links={infoLinks} />
			</footer>

			<div className="bg-bark border-t border-tan/15 px-16 py-5 flex justify-between items-center">
				<p className="text-[0.75rem] text-cream-white/35">
					© {new Date().getFullYear()} Tjiane Creations · Brakpan, South Africa
				</p>
				<p className="text-[0.75rem] text-cream-white/35">
					Payments by PayFast · Yoco
				</p>
			</div>
		</>
	);
}
