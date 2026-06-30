import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCustomOrderNotification(order: {
	id: number;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	bagStyle: string;
	monogramText: string | null;
	specialInstructions: string | null;
}) {
	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: process.env.ADMIN_NOTIFICATION_EMAIL!,
		subject: `New Custom Order Request — #${order.id}`,
		html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #2C1F14;">New Custom Order Request</h2>
        <p><strong>Order #${order.id}</strong></p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #5C3D24;">Name</td><td>${
						order.customerName
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Email</td><td>${
						order.customerEmail
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Phone</td><td>${
						order.customerPhone
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Bag Style</td><td>${
						order.bagStyle
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Monogram</td><td>${
						order.monogramText ?? "—"
					}</td></tr>
        </table>
        ${
					order.specialInstructions
						? `<p style="margin-top: 16px;"><strong>Notes:</strong><br>${order.specialInstructions}</p>`
						: ""
				}
        <a href="${
					process.env.APP_URL
				}/admin/custom-orders" style="display: inline-block; margin-top: 20px; background: #B05E3A; color: white; padding: 10px 24px; text-decoration: none; border-radius: 2px;">
          View in Admin
        </a>
      </div>
    `,
	});
}

export async function sendDepositRequestEmail(order: {
	id: number;
	customerName: string;
	customerEmail: string;
	depositAmount: number;
	paymentUrl: string;
}) {
	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: order.customerEmail,
		subject: `Your Custom Order Quote — Tjiane Creations`,
		html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #2C1F14;">Your custom order is ready to confirm</h2>
        <p>Hi ${order.customerName},</p>
        <p>Thank you for your custom order request. To begin crafting your bag, please pay the deposit below.</p>
        <p style="font-size: 1.4rem; font-weight: 600; color: #2C1F14;">
          Deposit: R ${order.depositAmount.toLocaleString("en-ZA")}
        </p>
        <a href="${
					order.paymentUrl
				}" style="display: inline-block; margin-top: 16px; background: #B05E3A; color: white; padding: 12px 28px; text-decoration: none; border-radius: 2px;">
          Pay Deposit Now
        </a>
        <p style="margin-top: 24px; color: #5C3D24; font-size: 0.85rem;">
          Once your deposit is received, we'll begin handcrafting your order.
        </p>
      </div>
    `,
	});
}

export async function sendCorporateEnquiryNotification(enquiry: {
	id: number;
	companyName: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
	quantity: number;
	bagStyle: string | null;
	brandingNotes: string | null;
}) {
	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: process.env.ADMIN_NOTIFICATION_EMAIL!,
		subject: `New Corporate Enquiry — ${enquiry.companyName}`,
		html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #2C1F14;">New Corporate Gifting Enquiry</h2>
        <p><strong>Enquiry #${enquiry.id}</strong></p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #5C3D24;">Company</td><td>${
						enquiry.companyName
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Contact</td><td>${
						enquiry.contactName
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Email</td><td>${
						enquiry.contactEmail
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Phone</td><td>${
						enquiry.contactPhone
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Quantity</td><td>${
						enquiry.quantity
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Bag Style</td><td>${
						enquiry.bagStyle ?? "—"
					}</td></tr>
        </table>
        ${
					enquiry.brandingNotes
						? `<p style="margin-top: 16px;"><strong>Branding Notes:</strong><br>${enquiry.brandingNotes}</p>`
						: ""
				}
        <a href="${
					process.env.APP_URL
				}/admin/corporate-enquiries" style="display: inline-block; margin-top: 20px; background: #B05E3A; color: white; padding: 10px 24px; text-decoration: none; border-radius: 2px;">
          View in Admin
        </a>
      </div>
    `,
	});
}

export async function sendCorporateQuoteEmail(enquiry: {
	id: number;
	contactName: string;
	contactEmail: string;
	companyName: string;
	quotedBudget: number;
	notes: string | null;
}) {
	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: enquiry.contactEmail,
		subject: `Your Corporate Gifting Quote — Tjiane Creations`,
		html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #2C1F14;">Your corporate gifting quote</h2>
        <p>Hi ${enquiry.contactName},</p>
        <p>Thank you for considering Tjiane Creations for ${
					enquiry.companyName
				}'s gifting needs.</p>
        <p style="font-size: 1.4rem; font-weight: 600; color: #2C1F14;">
          Quoted Total: R ${enquiry.quotedBudget.toLocaleString("en-ZA")}
        </p>
        ${
					enquiry.notes
						? `<p style="margin-top: 16px; color: #5C3D24;">${enquiry.notes}</p>`
						: ""
				}
        <p style="margin-top: 24px;">Reply to this email or WhatsApp us to confirm your order and timeline.</p>
      </div>
    `,
	});
}
