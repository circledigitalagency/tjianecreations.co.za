import { useState } from "react";

const COLOURS = [
	{ name: "Tan Brown", hex: "#8B6842" },
	{ name: "Dark Bark", hex: "#2C1F14" },
	{ name: "Caramel", hex: "#C8A97A" },
	{ name: "Cream / Nude", hex: "#E8D4B8" },
	{ name: "Charcoal", hex: "#4A4A4A" },
	{ name: "Burgundy", hex: "#8B2525" },
];

const FONTS = [
	{
		id: "Classic Serif",
		sample: "ABC",
		style: { fontFamily: "Georgia, serif", fontStyle: "normal" as const },
	},
	{
		id: "Script / Cursive",
		sample: "𝒜𝐵𝒞",
		style: { fontFamily: "Georgia, serif", fontStyle: "italic" as const },
	},
	{
		id: "Block Capitals",
		sample: "ABC",
		style: { fontFamily: "Impact, sans-serif", fontWeight: "900" as const },
	},
];

interface ItemConfig {
	desc: string;
	placement: string;
	svg: (col: string, dark: string, light: string) => React.ReactNode;
}

function darken(hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16),
		g = parseInt(hex.slice(3, 5), 16),
		b = parseInt(hex.slice(5, 7), 16);
	return (
		"#" +
		[r, g, b]
			.map((v) =>
				Math.max(0, Math.floor(v * 0.65))
					.toString(16)
					.padStart(2, "0"),
			)
			.join("")
	);
}
function lighten(hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16),
		g = parseInt(hex.slice(3, 5), 16),
		b = parseInt(hex.slice(5, 7), 16);
	return (
		"#" +
		[r, g, b]
			.map((v) =>
				Math.min(255, Math.floor(v * 1.35 + 30))
					.toString(16)
					.padStart(2, "0"),
			)
			.join("")
	);
}

const ITEMS: Record<string, ItemConfig> = {
	"Tote Bag": {
		desc: "Spacious everyday carry, hand-stitched from full-grain leather.",
		placement: "Front panel · centred",
		svg: (col, dark) => (
			<svg viewBox="0 0 180 160" width="180" height="160">
				<rect
					x="20"
					y="55"
					width="140"
					height="95"
					rx="8"
					fill={col}
					stroke={dark}
					strokeWidth="2"
				/>
				<rect x="40" y="55" width="100" height="8" rx="3" fill={dark} />
				<path
					d="M55 55 Q55 30 70 25 Q90 18 110 25 Q125 30 125 55"
					fill="none"
					stroke={dark}
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<line
					x1="20"
					y1="85"
					x2="160"
					y2="85"
					stroke={dark}
					strokeWidth="1"
					strokeDasharray="3,3"
					opacity="0.5"
				/>
				<rect
					x="75"
					y="88"
					width="30"
					height="20"
					rx="3"
					fill="none"
					stroke={dark}
					strokeWidth="1.5"
					opacity="0.6"
				/>
				<circle cx="90" cy="78" r="4" fill={dark} opacity="0.7" />
			</svg>
		),
	},
	"Clutch Bag": {
		desc: "Compact clutch for evenings out or a minimalist day bag.",
		placement: "Front flap · bottom right",
		svg: (col, dark, light) => (
			<svg viewBox="0 0 200 120" width="200" height="120">
				<rect
					x="15"
					y="30"
					width="170"
					height="80"
					rx="10"
					fill={col}
					stroke={dark}
					strokeWidth="2"
				/>
				<line
					x1="15"
					y1="68"
					x2="185"
					y2="68"
					stroke={dark}
					strokeWidth="1.5"
				/>
				<path
					d={`M15 68 Q100 78 185 68`}
					fill={light}
					stroke="none"
					opacity="0.3"
				/>
				<rect
					x="82"
					y="62"
					width="36"
					height="12"
					rx="4"
					fill="none"
					stroke={dark}
					strokeWidth="1.5"
				/>
				<rect
					x="88"
					y="65"
					width="24"
					height="6"
					rx="2"
					fill={dark}
					opacity="0.5"
				/>
			</svg>
		),
	},
	Crossbody: {
		desc: "Hands-free and stylish — adjustable strap, multiple pockets.",
		placement: "Front pocket · centred",
		svg: (col, dark) => (
			<svg viewBox="0 0 160 180" width="130" height="160">
				<rect
					x="25"
					y="40"
					width="110"
					height="125"
					rx="8"
					fill={col}
					stroke={dark}
					strokeWidth="2"
				/>
				<rect
					x="40"
					y="70"
					width="80"
					height="55"
					rx="5"
					fill="none"
					stroke={dark}
					strokeWidth="1.5"
				/>
				<line
					x1="40"
					y1="95"
					x2="120"
					y2="95"
					stroke={dark}
					strokeWidth="1"
					opacity="0.5"
				/>
				<circle
					cx="80"
					cy="108"
					r="6"
					fill="none"
					stroke={dark}
					strokeWidth="1.5"
				/>
				<line
					x1="80"
					y1="38"
					x2="65"
					y2="10"
					stroke={dark}
					strokeWidth="2"
					strokeLinecap="round"
				/>
				<line
					x1="65"
					y1="10"
					x2="95"
					y2="10"
					stroke={dark}
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<line
					x1="95"
					y1="10"
					x2="80"
					y2="38"
					stroke={dark}
					strokeWidth="2"
					strokeLinecap="round"
				/>
			</svg>
		),
	},
	Backpack: {
		desc: "Handcrafted leather backpack built to last for years.",
		placement: "Front panel · top centre",
		svg: (col, dark) => (
			<svg viewBox="0 0 160 190" width="130" height="165">
				<rect
					x="20"
					y="45"
					width="120"
					height="130"
					rx="12"
					fill={col}
					stroke={dark}
					strokeWidth="2"
				/>
				<path
					d="M55 45 Q55 20 80 16 Q105 20 105 45"
					fill="none"
					stroke={dark}
					strokeWidth="2.5"
				/>
				<rect
					x="35"
					y="70"
					width="90"
					height="60"
					rx="6"
					fill="none"
					stroke={dark}
					strokeWidth="1.5"
				/>
				<line
					x1="35"
					y1="98"
					x2="125"
					y2="98"
					stroke={dark}
					strokeWidth="1"
					opacity="0.5"
				/>
				<rect
					x="62"
					y="143"
					width="36"
					height="14"
					rx="4"
					fill="none"
					stroke={dark}
					strokeWidth="1.5"
				/>
				<circle cx="80" cy="150" r="3" fill={dark} opacity="0.6" />
			</svg>
		),
	},
	Keychain: {
		desc: "Small leather tag — a classic gift, beautifully stamped.",
		placement: "Centre of leather tag",
		svg: (col, dark) => (
			<svg viewBox="0 0 160 160" width="150" height="150">
				<circle
					cx="80"
					cy="38"
					r="22"
					fill="none"
					stroke={dark}
					strokeWidth="3"
				/>
				<circle
					cx="80"
					cy="38"
					r="14"
					fill="none"
					stroke={dark}
					strokeWidth="2"
					opacity="0.5"
				/>
				<rect
					x="48"
					y="58"
					width="64"
					height="80"
					rx="10"
					fill={col}
					stroke={dark}
					strokeWidth="2"
				/>
				<line
					x1="48"
					y1="82"
					x2="112"
					y2="82"
					stroke={dark}
					strokeWidth="1"
					opacity="0.4"
				/>
			</svg>
		),
	},
	Hat: {
		desc: "Leather-trimmed hat with personalised band or brim stamping.",
		placement: "Front band · centred",
		svg: (col, dark) => (
			<svg viewBox="0 0 200 150" width="190" height="140">
				<ellipse
					cx="100"
					cy="112"
					rx="85"
					ry="15"
					fill={col}
					stroke={dark}
					strokeWidth="2"
				/>
				<path
					d="M35 112 Q38 65 100 55 Q162 65 165 112"
					fill={col}
					stroke={dark}
					strokeWidth="2"
				/>
				<path
					d="M40 105 Q100 95 160 105"
					fill="none"
					stroke={dark}
					strokeWidth="3"
				/>
			</svg>
		),
	},
	Diary: {
		desc: "Leather-bound journal with your name on the cover.",
		placement: "Front cover · centred",
		svg: (col, dark, light) => (
			<svg viewBox="0 0 160 190" width="130" height="165">
				<rect
					x="30"
					y="20"
					width="110"
					height="145"
					rx="4"
					fill={col}
					stroke={dark}
					strokeWidth="2"
				/>
				<rect
					x="30"
					y="20"
					width="18"
					height="145"
					rx="4"
					fill={dark}
					opacity="0.35"
				/>
				<line x1="48" y1="20" x2="48" y2="165" stroke={dark} strokeWidth="1" />
				<line
					x1="55"
					y1="55"
					x2="130"
					y2="55"
					stroke={dark}
					strokeWidth="0.8"
					opacity="0.4"
				/>
				<line
					x1="55"
					y1="68"
					x2="130"
					y2="68"
					stroke={dark}
					strokeWidth="0.8"
					opacity="0.3"
				/>
				<line
					x1="55"
					y1="81"
					x2="130"
					y2="81"
					stroke={dark}
					strokeWidth="0.8"
					opacity="0.3"
				/>
				<rect
					x="140"
					y="55"
					width="6"
					height="35"
					rx="2"
					fill={dark}
					opacity="0.5"
				/>
			</svg>
		),
	},
};

interface Props {
	selectedType: string;
	onTypeChange: (type: string) => void;
	monogramText: string;
	onMonogramChange: (text: string) => void;
	selectedColourId: number | null;
	onColourChange: (id: number, hex: string) => void;
	selectedFont: string;
	onFontChange: (font: string) => void;
}

export default function ProductConfigurator({
	selectedType,
	onTypeChange,
	monogramText,
	onMonogramChange,
	selectedColourId,
	onColourChange,
	selectedFont,
	onFontChange,
}: Props) {
	const item = ITEMS[selectedType];
	const colourHex =
		selectedColourId !== null
			? COLOURS[selectedColourId]?.hex ?? "#C8A97A"
			: "#C8A97A";
	const dark = darken(colourHex);
	const light = lighten(colourHex);

	const currentFont = FONTS.find((f) => f.id === selectedFont) ?? FONTS[0];
	const monoSize =
		monogramText.length > 8
			? "1.4rem"
			: monogramText.length > 4
			? "1.8rem"
			: "2.4rem";

	return (
		<div className="sticky top-24">
			{/* Item type tabs */}
			<div className="flex flex-wrap gap-2 mb-5">
				{Object.keys(ITEMS).map((type) => (
					<button
						key={type}
						type="button"
						onClick={() => onTypeChange(type)}
						className={`px-3 py-1.5 text-[0.7rem] tracking-[0.1em] uppercase transition-all duration-150 border cursor-pointer font-body ${
							selectedType === type
								? "bg-bark text-cream border-bark"
								: "bg-transparent text-bark-mid border-bark-mid/40 hover:border-bark hover:text-bark"
						}`}
					>
						{type}
					</button>
				))}
			</div>

			{/* Preview card */}
			<div className="border border-tan/30 bg-cream-white overflow-hidden">
				{/* SVG preview */}
				<div
					className="relative flex items-center justify-center py-8 px-6"
					style={{
						background: `linear-gradient(135deg, ${colourHex}22, ${colourHex}55)`,
						minHeight: "220px",
					}}
				>
					<div className="transition-all duration-300">
						{item.svg(colourHex, dark, light)}
					</div>

					{/* Monogram overlay */}
					<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
						{monogramText ? (
							<span
								className="transition-all duration-200 select-none uppercase text-center"
								style={{
									...currentFont.style,
									fontSize: monoSize,
									letterSpacing: "0.18em",
									color: "rgba(44,31,20,0.55)",
									textShadow: "0 1px 0 rgba(255,255,255,0.25)",
									maxWidth: "80%",
									marginTop: "1.5rem",
								}}
							>
								{monogramText}
							</span>
						) : (
							<span
								className="text-[0.65rem] tracking-[0.1em] uppercase text-bark-mid/40"
								style={{ marginTop: "2rem" }}
							>
								Type initials to preview stamp
							</span>
						)}
					</div>

					{/* Coming soon badge */}
					<span className="absolute top-3 right-3 bg-bark/50 text-cream text-[0.6rem] tracking-[0.08em] uppercase px-2 py-0.5">
						Photo coming soon
					</span>
				</div>

				{/* Item info */}
				<div className="p-5 border-t border-tan/20">
					<div className="flex items-start justify-between mb-1.5">
						<h3 className="font-display font-semibold text-lg text-bark">
							{selectedType}
						</h3>
						<span className="text-[0.6rem] tracking-[0.08em] uppercase text-tan-dark border border-tan/40 px-2 py-0.5">
							Customisable
						</span>
					</div>
					<p className="text-[0.8rem] text-bark-mid leading-relaxed mb-2">
						{item.desc}
					</p>
					{monogramText && (
						<p className="text-[0.68rem] tracking-[0.05em] uppercase text-tan-dark">
							Stamp: {item.placement}
						</p>
					)}
				</div>
			</div>

			{/* Colour swatches inline under preview */}
			<div className="mt-4">
				<p className="text-[0.68rem] tracking-[0.12em] uppercase text-bark-mid mb-2">
					Leather colour
				</p>
				<div className="flex gap-2 flex-wrap">
					{COLOURS.map((c, i) => (
						<button
							key={c.name}
							type="button"
							title={c.name}
							onClick={() => onColourChange(i, c.hex)}
							style={{ backgroundColor: c.hex }}
							className={`w-7 h-7 rounded-full cursor-pointer border-0 transition-all duration-150 hover:scale-110 ${
								selectedColourId === i
									? "ring-2 ring-offset-2 ring-bark scale-110"
									: ""
							}`}
						/>
					))}
				</div>
			</div>

			{/* Font picker under preview */}
			<div className="mt-4">
				<p className="text-[0.68rem] tracking-[0.12em] uppercase text-bark-mid mb-2">
					Font style
				</p>
				<div className="flex gap-2">
					{FONTS.map((f) => (
						<button
							key={f.id}
							type="button"
							onClick={() => onFontChange(f.id)}
							className={`flex-1 border py-2 px-2 text-center cursor-pointer transition-all duration-150 ${
								selectedFont === f.id
									? "border-bark bg-bark text-cream"
									: "border-tan/40 text-bark-mid hover:border-bark"
							}`}
						>
							<span className="block text-base mb-0.5" style={f.style}>
								{f.sample}
							</span>
							<span className="block text-[0.6rem] tracking-[0.06em] uppercase">
								{f.id.split(" ")[0]}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
