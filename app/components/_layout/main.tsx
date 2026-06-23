import Header from "./header";
import Footer from "./footer";

interface MainLayoutProps {
	children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
	return (
		<div className="flex flex-col min-h-screen">
			<Header />
			{/* pt-20 offsets the fixed nav height */}
			<main className="flex-1 pt-20">{children}</main>
			<Footer />
		</div>
	);
}
