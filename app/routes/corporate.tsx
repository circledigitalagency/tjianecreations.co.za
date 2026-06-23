import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";

export const meta: MetaFunction = () => [
	{ title: "Corporate Gifting — Tjiane Creations" },
	{
		name: "description",
		content:
			"Branded leather bags for corporate events, staff rewards, and client gifts. Bulk pricing available.",
	},
];

const perks = [
	{ title: "Bulk Pricing", desc: "Reduced rates for orders of 10+" },
	{ title: "Logo Stamping", desc: "Company name or logo in leather" },
	{ title: "Custom Branding", desc: "Colours to match your identity" },
	{ title: "Gift Packaging", desc: "Presentation-ready delivery" },
];

export default function Corporate() {
	return (
		<MainLayout>
			{/* Intro banner */}
			<div className="bg-cream-white px-16 py-20 border-b border-tan/20">
				<span className="text-eyebrow text-tan-dark block mb-3">
					For Corporate Clients
				</span>
				<h1 className="font-display font-light text-[clamp(2.5rem,4vw,4.5rem)] leading-[1.15] text-bark mb-6">
					Branded gifts
					<br />
					they'll <em className="italic text-accent">actually</em> use.
				</h1>
				<p className="text-[0.93rem] leading-[1.9] text-bark-mid font-light max-w-[540px]">
					Elevate your next event, staff reward, or client gift with a
					handcrafted leather bag bearing your logo or message. Minimum
					quantities apply — get in touch to discuss your brief.
				</p>
			</div>

			{/* Perks grid + visual */}
			<section className="px-16 py-20">
				<div className="grid md:grid-cols-2 gap-20 items-center">
					{/* Visual placeholder */}
					<div className="aspect-square bg-gradient-to-br from-cream to-tan-light flex items-center justify-center text-[5rem] opacity-35 relative">
						💼
						<span className="absolute bottom-8 right-8 font-display italic text-[1.2rem] text-bark-mid opacity-60">
							For Business
						</span>
					</div>

					{/* Perks */}
					<div>
						<h2 className="font-display font-light text-[2rem] text-bark mb-8">
							What we offer
						</h2>
						<div className="grid grid-cols-2 gap-6 mb-10">
							{perks.map(({ title, desc }) => (
								<div key={title} className="border-l-2 border-tan pl-4">
									<div className="font-display font-semibold text-[1rem] text-bark mb-1">
										{title}
									</div>
									<div className="text-[0.8rem] text-bark-mid leading-[1.6]">
										{desc}
									</div>
								</div>
							))}
						</div>
						<Link
							to="/contact"
							className="bg-accent text-cream-white px-9 py-[0.9rem] text-[0.8rem] tracking-[0.12em] uppercase no-underline transition-all duration-200 hover:bg-bark inline-block"
						>
							Request a Corporate Quote
						</Link>
					</div>
				</div>
			</section>

			{/* Process */}
			<section className="bg-bark text-cream px-16 py-20">
				<h2 className="font-display font-light text-[2rem] text-cream mb-12">
					The corporate process
				</h2>
				<div className="grid md:grid-cols-3 gap-12">
					{[
						{
							n: "01",
							heading: "Brief us",
							body: "Tell us your order size, branding details, and preferred bag style. We'll confirm feasibility within 24 hours.",
						},
						{
							n: "02",
							heading: "Approve the sample",
							body: "We produce a single branded sample for your sign-off before running the full order.",
						},
						{
							n: "03",
							heading: "Receive & impress",
							body: "Orders are packaged individually, ready for gifting. We can deliver to your office or directly to recipients.",
						},
					].map(({ n, heading, body }) => (
						<div key={n}>
							<span className="font-display font-light text-[2.5rem] text-tan block mb-4 leading-none">
								{n}
							</span>
							<h3 className="font-body font-medium text-cream mb-3">
								{heading}
							</h3>
							<p className="text-[0.88rem] leading-[1.8] text-cream/70 font-light">
								{body}
							</p>
						</div>
					))}
				</div>
			</section>
		</MainLayout>
	);
}
