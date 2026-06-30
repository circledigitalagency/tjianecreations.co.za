import { MessageCircle } from "lucide-react";

export const WHATSAPP_NUMBER = "27829652850"; // no + or spaces, country code first

interface WhatsAppButtonProps {
	message?: string;
}

export default function WhatsAppButton({ message }: WhatsAppButtonProps) {
	const defaultMessage =
		"Hi! I'd like to find out more about Tjiane Creations.";
	const text = encodeURIComponent(message ?? defaultMessage);
	const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Chat on WhatsApp"
			className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
		>
			<img src="/images/whatsapp-icon.png" className="w-7" />
			{/* <MessageCircle
				size={26}
				className="text-white"
				fill="white"
				strokeWidth={0}
			/> */}
		</a>
	);
}
