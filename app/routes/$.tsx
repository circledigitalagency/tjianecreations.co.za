import { Link } from "@remix-run/react";
import MainLayout from "~/components/_layout/main";

export default function NotFound() {
	return (
		<MainLayout>
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
				<span className="font-display font-light text-[6rem] text-tan-light leading-none block mb-4">
					404
				</span>
				<h1 className="font-display font-light text-[2rem] text-bark mb-4">
					This page has wandered off.
				</h1>
				<p className="text-[0.93rem] text-bark-mid font-light mb-10">
					Let's get you back to the collection.
				</p>
				<Link
					to="/"
					className="bg-accent text-cream-white px-9 py-[0.9rem] text-[0.8rem] tracking-[0.12em] uppercase no-underline hover:bg-bark transition-colors"
				>
					Back to Home
				</Link>
			</div>
		</MainLayout>
	);
}
