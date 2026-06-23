const items = [
	"Genuine Leather",
	"Handcrafted",
	"Made in South Africa",
	"Custom Orders Welcome",
	"Corporate Gifting",
	"Personalised Bags",
];

// Duplicate to create seamless loop
const allItems = [...items, ...items];

export default function MarqueeBar() {
	return (
		<div className="bg-bark text-tan-light py-3.5 overflow-hidden">
			<div
				className="flex gap-16 whitespace-nowrap animate-marquee"
				style={{ width: "max-content" }}
			>
				{allItems.map((item, i) => (
					<span
						key={i}
						className="text-[0.72rem] tracking-[0.2em] uppercase before:content-['✦'] before:mr-16 before:text-accent"
					>
						{item}
					</span>
				))}
			</div>
		</div>
	);
}
