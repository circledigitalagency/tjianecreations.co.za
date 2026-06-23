import type { MetaFunction } from "@remix-run/node";
import MainLayout from "~/components/_layout/main";

export const meta: MetaFunction = () => [
	{ title: "Review — Tjiane Creations" },
	{ name: "description", content: "Add a review Tjiane Creations." },
];

export default function Review() {
	return (
		<MainLayout>
			<div className="px-16 py-20">
				<span className="text-eyebrow text-tan-dark block mb-3">Review</span>
				<h1 className="font-display font-light text-[clamp(2.5rem,4vw,4rem)] text-bark mb-12">
					We'd love to <em className="italic text-accent">hear</em> from you.
				</h1>

				<div className="grid md:grid-cols-2 gap-20">
					{/* Contact info */}
					<div className="space-y-8">
						{[
							{ label: "WhatsApp / Phone", value: "+27 XX XXX XXXX" },
							{ label: "Email", value: "hello@tjianecreations.co.za" },
							{ label: "Location", value: "Brakpan, Gauteng, South Africa" },
							{
								label: "Hours",
								value: "Mon–Fri: 9am – 5pm\nSat: By appointment",
							},
						].map(({ label, value }) => (
							<div key={label}>
								<p className="text-[0.7rem] tracking-[0.2em] uppercase text-tan-dark mb-1">
									{label}
								</p>
								<p className="text-bark font-light whitespace-pre-line">
									{value}
								</p>
							</div>
						))}
					</div>

					{/* Quick contact form */}
					<div className="space-y-5">
						{[
							{ label: "Your Name", type: "text", placeholder: "Full name" },
							{ label: "Email", type: "email", placeholder: "you@example.com" },
							{ label: "Phone (optional)", type: "tel", placeholder: "+27" },
						].map(({ label, type, placeholder }) => (
							<div key={label}>
								<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
									{label}
								</label>
								<input
									type={type}
									placeholder={placeholder}
									className="w-full border border-tan/40 bg-cream-white text-bark px-4 py-3 font-body text-[0.88rem] outline-none focus:border-tan transition-colors"
								/>
							</div>
						))}
						<div>
							<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
								Message
							</label>
							<textarea
								rows={4}
								placeholder="Tell us what you're looking for…"
								className="w-full border border-tan/40 bg-cream-white text-bark px-4 py-3 font-body text-[0.88rem] outline-none focus:border-tan transition-colors resize-y"
							/>
						</div>
						<button className="w-full bg-accent text-cream py-[0.9rem] text-[0.8rem] tracking-[0.12em] uppercase font-body transition-colors hover:bg-bark cursor-pointer border-0">
							Send Message
						</button>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
