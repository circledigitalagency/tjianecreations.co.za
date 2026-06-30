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
			{/* Hero quote */}
			<div className="bg-tan-light px-16 py-24">
				<div className="max-w-[720px]">
					<blockquote className="font-display font-light italic text-[clamp(2rem,4vw,3.5rem)] leading-[1.2] text-bark mb-8">
						"Made with patience, purpose, and pride."
					</blockquote>
					<p className="text-[0.95rem] leading-[1.9] text-bark-mid font-light">
						Tjiane Creations is a one-woman craft studio based in Brakpan, South
						Africa. Every bag is planned, cut, and stitched by hand — no
						shortcuts, no compromises. When you buy a Tjiane bag, you own
						something that will last for years and only gets better with time.
					</p>
				</div>
			</div>

			{/* Stats */}
			<div className="bg-bark text-cream grid grid-cols-3 divide-x divide-tan/20">
				{[
					{ num: "100%", label: "Genuine Leather" },
					{ num: "0", label: "Mass production — ever" },
					{ num: "1", label: "Maker, one studio" },
				].map(({ num, label }) => (
					<div key={label} className="px-12 py-14 text-center">
						<span className="font-display font-light text-[3.5rem] text-tan block mb-3 leading-none">
							{num}
						</span>
						<p className="text-[0.75rem] tracking-[0.15em] uppercase text-cream/60">
							{label}
						</p>
					</div>
				))}
			</div>

			{/* Founder section */}
			<div className="px-16 py-20 grid md:grid-cols-2 gap-16 items-center border-b border-tan/20">
				{/* Photo */}
				<div className="aspect-[4/5] bg-gradient-to-br from-tan-light to-tan overflow-hidden">
					{/* Replace with her actual photo once uploaded */}
					<div className="w-full h-full flex items-center justify-center text-[5rem] opacity-25">
						📷
					</div>
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
							[Her personal story goes here — how she got into leatherwork, what
							drew her to it, and what the craft means to her. This is the
							section where her voice should come through directly.]
						</p>
						<p>
							[A line or two about her process — working from a kitchen table,
							learning by hand, the patience the craft demands.]
						</p>
						<p>
							[Optional closing line tying her personal mission to what
							customers get when they buy from her.]
						</p>
					</div>
				</div>
			</div>

			{/* Story — why leather, why handmade */}
			<div className="px-16 py-20 grid md:grid-cols-2 gap-20 items-start">
				<div>
					<span className="text-eyebrow text-tan-dark block mb-3">
						The Story
					</span>
					<h2 className="font-display font-light text-[2rem] text-bark mb-6">
						Why leather, why handmade?
					</h2>
					<div className="space-y-4 text-[0.93rem] leading-[1.9] text-bark-mid font-light">
						<p>
							It started with a single bag — cut from a remnant piece of hide
							and stitched on a kitchen table in Brakpan. The process was
							meditative, the result was something no factory could replicate.
						</p>
						<p>
							Every Tjiane bag is designed to age beautifully. The leather
							develops a patina unique to its owner. Scratches soften. The
							surface deepens. It becomes more itself the more it's carried.
						</p>
						<p>
							There are no machines, no teams, no cutting corners. Just
							patience, sharp tools, and a commitment to making something that
							lasts a lifetime.
						</p>
					</div>
				</div>

				{/* Visual placeholder */}
				<div className="aspect-[4/5] bg-gradient-to-br from-tan-light to-tan flex items-center justify-center text-[6rem] opacity-30">
					🤲
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
