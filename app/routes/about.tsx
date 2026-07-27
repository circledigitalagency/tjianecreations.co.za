import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";

export const meta: MetaFunction = () => [
	{ title: "About — Tjiane Creations" },
	{
		name: "description",
		content:
			"The story behind Tjiane Creations — a one-woman leather craft studio in Brakpan, South Africa.",
	},
];

export default function About() {
	return (
		<MainLayout>
			{/* Founder section */}
			<div className="px-16 py-20 grid md:grid-cols-2 gap-16 items-center border-b border-tan/20">
				{/* Photo */}
				<div className="aspect-[4/5] bg-gradient-to-br from-tan-light to-tan overflow-hidden">
					{/* Replace with her actual photo once uploaded */}
					<img
						className="w-full h-full flex items-center justify-center text-[5rem] opacity-80"
						src="https://res.cloudinary.com/dfxorvtuc/image/upload/v1783963342/Request_Information_from_Joan_szjfdr.jpg"
					/>
				</div>

				{/* Story */}
				<div>
					<span className="text-eyebrow text-tan-dark block mb-3">
						Meet the Maker
					</span>
					<h2 className="font-display font-light text-[2rem] text-bark mb-6">
						Hi, I'm Hloniphani.
					</h2>
					<div className="space-y-4 text-[0.93rem] leading-[1.9] text-bark-mid font-light">
						<p>
							Hloniphani Eva Chiane, the founder and maker behind Tjiane
							Creations. My journey began with a simple belief: the things we
							carry every day should be made to last and tell a story. After
							more than 25 years in supply chain management, I followed my
							passion for leather craftsmanship and turned it into a brand
							dedicated to creating timeless pieces with purpose.
						</p>
						<p>
							Every item is carefully handcrafted from genuine leather,
							combining traditional craftsmanship with thoughtful design. I
							don’t believe in fast fashion,I believe in creating pieces that
							become part of your journey, grow more beautiful with time, and
							can one day be passed on as a legacy.
						</p>
						<p>
							Tjiane Creations is more than a leather brand; it’s a celebration
							of quality, authenticity, and the stories we carry with us. Thank
							you for allowing my craft to become a part of yours.
						</p>
					</div>
				</div>
			</div>

			{/* CTA strip */}
			<div className="bg-cream-white border-t border-tan/20 px-16 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
				<div>
					<h3 className="font-display font-light text-[1.8rem] text-bark mb-2">
						Ready to own one?
					</h3>
					<p className="text-[0.9rem] text-bark-mid font-light">
						Shop the collection or start a custom order today.
					</p>
				</div>
				<div className="flex gap-4 flex-wrap">
					<Link
						to="/shop"
						className="bg-accent text-cream-white px-9 py-[0.9rem] text-[0.8rem] tracking-[0.12em] uppercase no-underline transition-all hover:bg-bark inline-block"
					>
						Browse the Shop
					</Link>
					<Link
						to="/custom"
						className="border border-bark-mid text-bark-mid px-9 py-[0.9rem] text-[0.8rem] tracking-[0.12em] uppercase no-underline transition-all hover:bg-bark-mid hover:text-cream inline-block"
					>
						Custom Order
					</Link>
				</div>
			</div>
		</MainLayout>
	);
}
