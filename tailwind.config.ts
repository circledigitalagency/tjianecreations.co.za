import type { Config } from "tailwindcss";

export default {
	content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				// Brand palette extracted from Tjiane Creations design
				tan: {
					DEFAULT: "#C8A97A",
					light: "#E8D5B5",
					dark: "#8B6842",
				},
				cream: {
					DEFAULT: "#F5EFE4",
					white: "#FDFAF5",
				},
				bark: {
					DEFAULT: "#2C1F14",
					mid: "#5C3D24",
				},
				accent: "#B05E3A",
			},
			fontFamily: {
				display: ['"Cormorant Garamond"', "Georgia", "serif"],
				body: ["Jost", "system-ui", "sans-serif"],
			},
			fontSize: {
				eyebrow: ["0.72rem", { letterSpacing: "0.25em", lineHeight: "1" }],
				nav: ["0.78rem", { letterSpacing: "0.15em", lineHeight: "1" }],
				chip: ["0.72rem", { letterSpacing: "0.12em", lineHeight: "1" }],
			},
			letterSpacing: {
				widest2: "0.2em",
				widest3: "0.25em",
			},
			backgroundImage: {
				"tan-gradient":
					"linear-gradient(135deg, #D4B896 0%, #C8A97A 40%, #8B6842 100%)",
				"tan-gradient-soft": "linear-gradient(160deg, #E8D5B5, #C8A97A)",
			},
			animation: {
				marquee: "marquee 25s linear infinite",
			},
			keyframes: {
				marquee: {
					"0%": { transform: "translateX(0)" },
					"100%": { transform: "translateX(-50%)" },
				},
			},
		},
	},
	plugins: [],
} satisfies Config;
