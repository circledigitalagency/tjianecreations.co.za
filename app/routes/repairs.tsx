import type { MetaFunction } from "@remix-run/node";
import { Camera, Video, Layers } from "lucide-react";
import MainLayout from "~/components/_layout/main";
import WhatsAppButton, { WHATSAPP_NUMBER } from "~/components/buttons/whatsapp";

export const meta: MetaFunction = () => [
	{ title: "Repairs & Care — Tjiane Creations" },
	{
		name: "description",
		content:
			"Bring your leather goods back to life. We repair items from any maker.",
	},
];

const REPAIR_MESSAGE =
	"Hi! I'd like to request a repair quote. I'll send photos, a video, and details about the material.";

export default function Repairs() {
	const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
		REPAIR_MESSAGE,
	)}`;

	return (
		<MainLayout>
			<div className="bg-bark text-cream px-16 py-20">
				<div className="max-w-[640px]">
					<p className="text-[0.7rem] tracking-[0.25em] uppercase text-tan mb-4">
						Repairs & Care
					</p>
					<h1 className="font-display font-light text-[clamp(2.5rem,4vw,4.5rem)] leading-[1.15] mb-6">
						Give it a <em className="italic text-tan">second life</em>.
					</h1>
					<p className="text-[0.93rem] leading-[1.9] text-cream-white/70 font-light">
						Whether it's a Tjiane original or a leather piece from elsewhere, we
						repair stitching, hardware, handles, and more. Send us photos and a
						video over WhatsApp and we'll quote you.
					</p>
				</div>
			</div>

			<div className="px-16 py-20 max-w-3xl mx-auto">
				<h2 className="font-display font-light text-2xl text-bark mb-8">
					What to send us
				</h2>

				<div className="grid md:grid-cols-3 gap-8 mb-12">
					{[
						{
							icon: Camera,
							label: "Photos",
							detail: "Clear shots of the damaged area, in good lighting.",
						},
						{
							icon: Video,
							label: "A Video",
							detail: "A short video showing the issue from different angles.",
						},
						{
							icon: Layers,
							label: "Material",
							detail:
								"Tell us the leather type, if known, and where it was made.",
						},
					].map(({ icon: Icon, label, detail }) => (
						<div key={label} className="text-center">
							<div className="w-12 h-12 mx-auto mb-4 rounded-full bg-tan-light flex items-center justify-center">
								<Icon size={22} className="text-bark" />
							</div>
							<h3 className="font-body font-medium text-bark mb-2">{label}</h3>
							<p className="text-[0.85rem] text-bark-mid leading-relaxed font-light">
								{detail}
							</p>
						</div>
					))}
				</div>

				<div className="text-center">
					<a
						href={whatsappUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-3 bg-[#25D366] text-white px-10 py-4 text-[0.8rem] tracking-[0.12em] uppercase no-underline hover:opacity-90 transition-opacity"
					>
						<img src="/images/whatsapp-icon.png" className="w-7" /> Start a
						Repair Request on WhatsApp
					</a>
					<p className="text-[0.78rem] text-bark-mid mt-4">
						We'll get back to you with a quote within 24–48 hours.
					</p>
				</div>
			</div>
		</MainLayout>
	);
}
