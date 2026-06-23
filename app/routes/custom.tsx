import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import MainLayout from "~/components/_layout/main";

export const meta: MetaFunction = () => [
	{ title: "Custom Orders — Tjiane Creations" },
	{
		name: "description",
		content:
			"Order a handcrafted leather bag made exactly to your specifications — monogram, colour, stitching and more.",
	},
];

const bagStyles = ["Tote Bag", "Clutch Bag", "Crossbody", "Backpack"];
const fontOptions = ["Classic Serif", "Script / Cursive", "Block Capitals"];
const customOptions = [
	"Monogram / Text",
	"Leather Colour",
	"Stitching Colour",
	"Bag Style",
	"Strap Length",
	"Lining Fabric",
];

const leatherSwatches = [
	{ hex: "#8B6842", label: "Tan Brown" },
	{ hex: "#2C1F14", label: "Dark Bark" },
	{ hex: "#C8A97A", label: "Caramel" },
	{ hex: "#F5EFE4", label: "Cream / Nude" },
	{ hex: "#4A4A4A", label: "Charcoal" },
	{ hex: "#8B2525", label: "Burgundy" },
];

export default function Custom() {
	const [selectedSwatch, setSelectedSwatch] = useState("#8B6842");

	return (
		<MainLayout>
			{/* Hero banner */}
			<div className="bg-bark text-cream px-16 py-20">
				<div className="max-w-[680px]">
					<p className="text-[0.7rem] tracking-[0.25em] uppercase text-tan mb-4">
						Make it Yours
					</p>
					<h1 className="font-display font-light text-[clamp(2.5rem,4vw,4.5rem)] leading-[1.15] mb-6">
						A bag as <em className="italic text-tan">unique</em>
						<br />
						as you are.
					</h1>
					<p className="text-[0.93rem] leading-[1.9] text-cream-white/70 font-light">
						Tell us exactly what you want — the leather shade, the words to
						stamp, the stitching colour. We'll handcraft it and deliver it to
						your door.
					</p>
				</div>
			</div>

			{/* Options chips */}
			<div className="bg-bark px-16 pb-16">
				<div className="flex flex-wrap gap-3">
					{customOptions.map((opt) => (
						<span
							key={opt}
							className="border border-tan/40 text-tan-light px-4 py-2 text-chip uppercase tracking-[0.12em]"
						>
							{opt}
						</span>
					))}
				</div>
			</div>

			{/* Form section */}
			<div className="px-16 py-20">
				<div className="grid md:grid-cols-2 gap-20 items-start">
					{/* Explainer */}
					<div>
						<h2 className="font-display font-light text-[2rem] text-bark mb-6">
							How it works
						</h2>
						<div className="space-y-6">
							{[
								{
									step: "01",
									heading: "Fill the form",
									body: "Describe your ideal bag — style, colour, monogram text, and any special details.",
								},
								{
									step: "02",
									heading: "Pay a deposit",
									body: "We'll confirm your order and request a 50% deposit to begin crafting.",
								},
								{
									step: "03",
									heading: "We handcraft it",
									body: "Your bag is cut, stitched, and stamped by hand. Allow 7–14 business days.",
								},
								{
									step: "04",
									heading: "Delivered to you",
									body: "We ship nationwide via The Courier Guy. Final balance due before dispatch.",
								},
							].map(({ step, heading, body }) => (
								<div key={step} className="flex gap-6">
									<span className="font-display font-light text-[1.8rem] text-tan-dark leading-none shrink-0 w-10">
										{step}
									</span>
									<div>
										<div className="font-body font-medium text-bark mb-1">
											{heading}
										</div>
										<div className="text-[0.88rem] leading-[1.7] text-bark-mid font-light">
											{body}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Order form */}
					<div className="bg-bark/5 border border-tan/25 p-8">
						<p className="text-[0.7rem] tracking-[0.2em] uppercase text-tan-dark mb-6">
							Order Customisation Form
						</p>

						<div className="space-y-5">
							<FormRow label="Bag Style">
								<select className="form-field">
									<option value="">Select a style…</option>
									{bagStyles.map((s) => (
										<option key={s}>{s}</option>
									))}
								</select>
							</FormRow>

							<FormRow label="Text / Initials to stamp">
								<input
									type="text"
									placeholder="e.g. 'TNK' or 'With Love, Mom'"
									className="form-field"
								/>
							</FormRow>

							<FormRow label="Font preference">
								<select className="form-field">
									<option value="">Select a font…</option>
									{fontOptions.map((f) => (
										<option key={f}>{f}</option>
									))}
								</select>
							</FormRow>

							<FormRow label="Leather Colour">
								<div className="flex gap-3 flex-wrap mt-1">
									{leatherSwatches.map(({ hex, label }) => (
										<button
											key={hex}
											onClick={() => setSelectedSwatch(hex)}
											title={label}
											style={{ backgroundColor: hex }}
											className={`w-7 h-7 rounded-full cursor-pointer transition-transform duration-200 hover:scale-110 border-0 ${
												selectedSwatch === hex
													? "ring-2 ring-offset-2 ring-tan"
													: ""
											}`}
										/>
									))}
								</div>
							</FormRow>

							<FormRow label="Special Instructions">
								<textarea
									placeholder="Any other details — pocket placement, lining fabric, delivery date…"
									rows={3}
									className="form-field resize-y"
								/>
							</FormRow>

							<button className="w-full bg-tan text-bark py-[0.9rem] text-[0.78rem] tracking-[0.15em] uppercase font-medium font-body transition-colors hover:bg-tan-light mt-2 cursor-pointer border-0">
								Submit & Pay Deposit
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Inline styles for form fields to avoid Tailwind JIT issues with form elements */}
			<style>{`
        .form-field {
          width: 100%;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(200,169,122,0.35);
          color: #2C1F14;
          padding: 0.7rem 0.9rem;
          font-family: 'Jost', sans-serif;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
          appearance: auto;
        }
        .form-field:focus {
          border-color: #C8A97A;
        }
      `}</style>
		</MainLayout>
	);
}

function FormRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label className="block text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-1.5">
				{label}
			</label>
			{children}
		</div>
	);
}
