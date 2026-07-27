import { Resend } from "resend";
import { pool } from "./db.server";

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
	bagStyle?: string;
	quotedTotal?: number;
}) {
	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: order.customerEmail,
		subject: `Your custom order quote is ready — Tjiane Creations`,
		html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; background: #F5EFE4; padding: 0;">

        <!-- Header -->
        <div style="background: #2C1F14; padding: 28px 32px;">
          <p style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #C8A97A; margin: 0 0 4px;">Tjiane Creations</p>
          <p style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #C8A97A; opacity: 0.6; margin: 0;">Custom Order #${
						order.id
					}</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 32px;">
          <h1 style="font-weight: 300; color: #2C1F14; margin: 0 0 8px; font-size: 26px; line-height: 1.2;">
            Your quote is ready
          </h1>
          <p style="color: #8B6842; font-size: 14px; margin: 0 0 28px;">
            Hi ${
							order.customerName
						}, we've reviewed your request and your quote is below.
          </p>

          <!-- Quote breakdown -->
          <div style="background: #FDFAF5; border: 1px solid #E8D5B5; padding: 20px 24px; margin-bottom: 28px;">
            ${
							order.bagStyle
								? `
            <div style="display: flex; justify-content: space-between; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #E8D5B5;">
              <span style="color: #5C3D24; font-size: 13px;">Item</span>
              <span style="color: #2C1F14; font-size: 13px;">${order.bagStyle}</span>
            </div>`
								: ""
						}
            ${
							order.quotedTotal
								? `
            <div style="display: flex; justify-content: space-between; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #E8D5B5;">
              <span style="color: #5C3D24; font-size: 13px;">Quoted total</span>
              <span style="color: #2C1F14; font-size: 20px; font-weight: 600;">R ${order.quotedTotal.toLocaleString(
								"en-ZA",
							)}</span>
            </div>`
								: ""
						}
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #2C1F14; font-size: 15px; font-weight: 500;">Deposit due now (50%)</span>
              <span style="color: #2C1F14; font-size: 20px; font-weight: 600;">R ${order.depositAmount.toLocaleString(
								"en-ZA",
							)}</span>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${order.paymentUrl}"
               style="display: inline-block; background: #B05E3A; color: #FDFAF5; padding: 14px 36px; text-decoration: none; font-family: sans-serif; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
              Pay Deposit — R ${order.depositAmount.toLocaleString("en-ZA")}
            </a>
          </div>

          <p style="color: #8B6842; font-size: 13px; line-height: 1.7; margin: 0; text-align: center;">
            Once your deposit is received, we'll begin handcrafting your order.<br/>
            The remaining balance will be due before dispatch.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #2C1F14; padding: 20px 32px; text-align: center;">
          <p style="font-size: 11px; color: #C8A97A; margin: 0 0 4px; letter-spacing: 1px;">
            Tjiane Creations · Handcrafted in Brakpan, South Africa
          </p>
          <p style="font-size: 11px; color: #8B6842; margin: 0;">
            Questions? Reply to this email or WhatsApp us directly.
          </p>
        </div>

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
		subject: `Your corporate gifting quote — Tjiane Creations`,
		html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; background: #F5EFE4; padding: 0;">

        <!-- Header -->
        <div style="background: #2C1F14; padding: 28px 32px;">
          <p style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #C8A97A; margin: 0 0 4px;">Tjiane Creations</p>
          <p style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #C8A97A; opacity: 0.6; margin: 0;">Corporate Gifting — Enquiry #${
						enquiry.id
					}</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 32px;">
          <h1 style="font-weight: 300; color: #2C1F14; margin: 0 0 8px; font-size: 26px; line-height: 1.2;">
            Your quote is ready
          </h1>
          <p style="color: #8B6842; font-size: 14px; margin: 0 0 28px; line-height: 1.7;">
            Hi ${
							enquiry.contactName
						}, thank you for considering Tjiane Creations
            for ${enquiry.companyName}'s gifting needs. Here's your quote:
          </p>

          <!-- Quote box -->
          <div style="background: #FDFAF5; border: 1px solid #E8D5B5; padding: 20px 24px; margin-bottom: 28px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #5C3D24; font-size: 14px;">Quoted total</span>
              <span style="color: #2C1F14; font-size: 22px; font-weight: 600;">
                R ${enquiry.quotedBudget.toLocaleString("en-ZA")}
              </span>
            </div>
            ${
							enquiry.notes
								? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #E8D5B5;">
              <p style="color: #5C3D24; font-size: 13px; margin: 0; line-height: 1.7;">${enquiry.notes}</p>
            </div>`
								: ""
						}
          </div>

          <!-- Next steps -->
          <div style="background: #FDFAF5; border-left: 3px solid #C8A97A; padding: 16px 20px; margin-bottom: 28px;">
            <p style="color: #2C1F14; font-size: 13px; font-weight: 500; margin: 0 0 6px;">Next steps</p>
            <p style="color: #5C3D24; font-size: 13px; margin: 0; line-height: 1.7;">
              Reply to this email or WhatsApp us to confirm your order,
              finalise item details, and agree on a timeline. A 50% deposit
              will be required to begin production.
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align: center;">
            <a href="https://wa.me/27635007223?text=Hi%2C+I'd+like+to+confirm+my+corporate+order+%23${
							enquiry.id
						}"
               style="display: inline-block; background: #25D366; color: #ffffff; padding: 13px 32px; text-decoration: none; font-family: sans-serif; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
              Confirm via WhatsApp
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2C1F14; padding: 20px 32px; text-align: center;">
          <p style="font-size: 11px; color: #C8A97A; margin: 0 0 4px; letter-spacing: 1px;">
            Tjiane Creations · Handcrafted in Brakpan, South Africa
          </p>
          <p style="font-size: 11px; color: #8B6842; margin: 0;">
            Questions? Reply to this email or WhatsApp us directly.
          </p>
        </div>

      </div>
    `,
	});
}

export async function sendNewDropEmails(product: {
	name: string;
	slug: string;
	price: number;
	imageUrl: string | null;
	description: string | null;
}) {
	const [subscribers] = (await pool.query(
		"SELECT email, name, unsubscribe_token FROM customers WHERE marketing_opt_in = 1",
	)) as any;

	const appUrl = process.env.APP_URL;
	let sent = 0;

	for (const sub of subscribers as any[]) {
		try {
			await resend.emails.send({
				from: process.env.RESEND_FROM_EMAIL!,
				to: sub.email,
				subject: `New Drop: ${product.name} — Tjiane Creations`,
				html: `
          <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; background: #F5EFE4; padding: 32px;">
            <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8B6842; text-align: center;">New Drop</p>
            <h1 style="font-weight: 300; color: #2C1F14; text-align: center; margin: 8px 0 24px;">${
							product.name
						}</h1>
            ${
							product.imageUrl
								? `<img src="${appUrl}${product.imageUrl}" alt="${product.name}" style="width: 100%; display: block; margin-bottom: 24px;" />`
								: ""
						}
            ${
							product.description
								? `<p style="color: #5C3D24; font-size: 14px; line-height: 1.8; text-align: center;">${product.description}</p>`
								: ""
						}
            <p style="font-size: 22px; font-weight: 600; color: #2C1F14; text-align: center;">R ${product.price.toLocaleString(
							"en-ZA",
						)}</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${appUrl}/shop/${
					product.slug
				}" style="background: #B05E3A; color: #FDFAF5; padding: 13px 36px; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Shop Now</a>
            </div>
            <p style="text-align: center; font-size: 11px; color: #8B6842; margin-top: 32px;">
              Handcrafted in Brakpan, South Africa<br/>
              <a href="${appUrl}/unsubscribe?token=${
					sub.unsubscribe_token
				}" style="color: #8B6842;">Unsubscribe</a>
            </p>
          </div>
        `,
			});
			sent++;
		} catch (e) {
			console.error(`Failed to send to ${sub.email}:`, e);
		}
	}

	return sent;
}

export async function sendOrderConfirmationEmail(order: {
	id: number;
	customerName: string;
	customerEmail: string;
	totalAmount: number;
	shippingMethod: string;
	shippingAddress: string;
	items: {
		name: string;
		quantity: number;
		price: number;
		colour?: string | null;
		size?: string | null;
	}[];
}) {
	const appUrl = process.env.APP_URL;

	const itemRows = order.items
		.map(
			(item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E8D5B5;">
        <div style="color: #2C1F14; font-size: 14px; font-weight: 500;">
          ${item.name}
        </div>
        ${
					item.colour || item.size
						? `
        <div style="color: #8B6842; font-size: 12px; margin-top: 3px;">
          ${[item.colour, item.size].filter(Boolean).join(" · ")}
        </div>`
						: ""
				}
        <div style="color: #5C3D24; font-size: 12px; margin-top: 2px;">
          Qty: ${item.quantity}
        </div>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #E8D5B5; text-align: right; vertical-align: top; color: #2C1F14; font-size: 14px; font-weight: 500; white-space: nowrap;">
        R ${(item.price * item.quantity).toLocaleString("en-ZA")}
      </td>
    </tr>`,
		)
		.join("");

	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: order.customerEmail,
		subject: `Order Confirmed #${order.id} — Tjiane Creations`,
		html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; background: #F5EFE4; padding: 32px;">
        <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8B6842; text-align: center;">Order Confirmed</p>
        <h1 style="font-weight: 300; color: #2C1F14; text-align: center; margin: 8px 0 8px;">Thank you, ${
					order.customerName
				}</h1>
        <p style="color: #5C3D24; font-size: 14px; text-align: center; margin-bottom: 28px;">
          Your order <strong>#${order.id}</strong> has been received and paid.
        </p>

        <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #C8A97A; border-bottom: 1px solid #C8A97A;">
          ${itemRows}
        </table>

        <table style="width: 100%; margin-top: 12px;">
          <tr>
            <td style="color: #5C3D24; font-size: 14px;">Total paid</td>
            <td style="color: #2C1F14; font-size: 18px; font-weight: 600; text-align: right;">
              R ${order.totalAmount.toLocaleString("en-ZA")}
            </td>
          </tr>
        </table>

        <div style="margin-top: 24px; padding: 16px; background: #FDFAF5;">
          <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8B6842; margin: 0 0 6px;">Delivery</p>
          <p style="color: #2C1F14; font-size: 13px; margin: 0; line-height: 1.6;">
            ${order.shippingAddress}<br/>
            via ${order.shippingMethod.replace("_", " ")}
          </p>
        </div>

        <p style="color: #5C3D24; font-size: 13px; text-align: center; margin-top: 24px; line-height: 1.7;">
          We'll be in touch when your order ships. Questions?
          Just reply to this email or WhatsApp us.
        </p>

        <p style="text-align: center; font-size: 11px; color: #8B6842; margin-top: 28px;">
          Tjiane Creations · Handcrafted in Brakpan, South Africa<br/>
          <a href="${appUrl}" style="color: #8B6842;">tjianecreations.co.za</a>
        </p>
      </div>
    `,
	});
}

export async function sendNewOrderAdminNotification(order: {
	id: number;
	customerName: string;
	customerEmail: string;
	totalAmount: number;
	itemCount: number;
}) {
	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: process.env.ADMIN_NOTIFICATION_EMAIL!,
		subject: `💰 New Order #${order.id} — R ${order.totalAmount.toLocaleString(
			"en-ZA",
		)}`,
		html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #2C1F14;">New paid order!</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #5C3D24;">Order</td><td>#${
						order.id
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Customer</td><td>${
						order.customerName
					} (${order.customerEmail})</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Items</td><td>${
						order.itemCount
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Total</td><td><strong>R ${order.totalAmount.toLocaleString(
						"en-ZA",
					)}</strong></td></tr>
        </table>
        <a href="${process.env.APP_URL}/admin/orders?search=${
			order.id
		}" style="display: inline-block; margin-top: 20px; background: #B05E3A; color: white; padding: 10px 24px; text-decoration: none; border-radius: 2px;">
          View Order
        </a>
      </div>
    `,
	});
}
export async function sendCustomOrderStatusEmail(order: {
	id: number;
	customerName: string;
	customerEmail: string;
	bagStyle: string;
	status: string;
	trackingNumber?: string | null;
}) {
	const statusMessages: Record<
		string,
		{ subject: string; heading: string; body: string }
	> = {
		deposit_paid: {
			subject: `Your custom order #${order.id} is confirmed`,
			heading: "Deposit received — we're on it!",
			body: `Your deposit has been received and your ${order.bagStyle} is now confirmed. We'll begin working on it shortly.`,
		},
		in_production: {
			subject: `Your custom order #${order.id} is being made`,
			heading: "Your piece is being handcrafted",
			body: `Great news — your ${order.bagStyle} is now in production. We'll let you know when it's ready.`,
		},
		ready: {
			subject: `Your custom order #${order.id} is ready`,
			heading: "Your piece is ready!",
			body: `Your ${order.bagStyle} is finished and ready for dispatch. We'll be in touch about the balance payment and shipping.`,
		},
		shipped: {
			subject: `Your custom order #${order.id} has been shipped`,
			heading: "Your piece is on its way",
			body: `Your ${order.bagStyle} has been shipped.${
				order.trackingNumber
					? ` Your tracking number is <strong>${order.trackingNumber}</strong>.`
					: " We'll send your tracking number shortly."
			}`,
		},
		payment_complete: {
			subject: `Your custom order #${order.id} is complete`,
			heading: "Payment received — thank you!",
			body: `Your full payment for your ${order.bagStyle} has been received. We'll be in touch shortly with your shipping details.`,
		},
		complete: {
			subject: `Your custom order #${order.id} is complete`,
			heading: "Order complete — enjoy!",
			body: `Your ${order.bagStyle} has been delivered. Thank you for choosing Tjiane Creations — we hope you love it!`,
		},
		cancelled: {
			subject: `Your custom order #${order.id} has been cancelled`,
			heading: "Order cancelled",
			body: `Your custom order for a ${order.bagStyle} has been cancelled. If you have questions, please reply to this email or WhatsApp us.`,
		},
	};

	const content = statusMessages[order.status];
	if (!content) return; // don't send for statuses without a message

	const appUrl = process.env.APP_URL;

	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: order.customerEmail,
		subject: content.subject,
		html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; background: #F5EFE4; padding: 32px;">
        <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8B6842; text-align: center; margin: 0 0 8px;">Custom Order #${order.id}</p>
        <h1 style="font-weight: 300; color: #2C1F14; text-align: center; margin: 0 0 24px; font-size: 24px;">${content.heading}</h1>
        <p style="color: #5C3D24; font-size: 14px; line-height: 1.8; text-align: center; margin: 0 0 28px;">${content.body}</p>
        <p style="color: #5C3D24; font-size: 13px; text-align: center; margin-top: 24px;">
          Questions? Reply to this email or WhatsApp us directly.
        </p>
        <p style="text-align: center; font-size: 11px; color: #8B6842; margin-top: 28px;">
          Tjiane Creations · Handcrafted in Brakpan, South Africa<br/>
          <a href="${appUrl}" style="color: #8B6842;">tjianecreations.co.za</a>
        </p>
      </div>
    `,
	});
}

export async function sendCustomOrderDepositAdminNotification(order: {
	id: number;
	customerName: string;
	customerEmail: string;
	bagStyle: string;
	depositPaid: number;
}) {
	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: process.env.ADMIN_NOTIFICATION_EMAIL!,
		subject: `Deposit received — Custom Order #${order.id}`,
		html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #2C1F14;">Deposit received!</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #5C3D24;">Order</td><td>#${
						order.id
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Customer</td><td>${
						order.customerName
					} (${order.customerEmail})</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Item</td><td>${
						order.bagStyle
					}</td></tr>
          <tr><td style="padding: 6px 0; color: #5C3D24;">Deposit paid</td><td><strong>R ${order.depositPaid.toLocaleString(
						"en-ZA",
					)}</strong></td></tr>
        </table>
        <a href="${process.env.APP_URL}/admin/custom-orders"
           style="display: inline-block; margin-top: 20px; background: #B05E3A; color: white; padding: 10px 24px; text-decoration: none;">
          View in Admin
        </a>
      </div>
    `,
	});
}

export async function sendBalanceRequestEmail(order: {
	id: number;
	customerName: string;
	customerEmail: string;
	bagStyle: string;
	balanceAmount: number;
	paymentUrl: string;
}) {
	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: order.customerEmail,
		subject: `Balance payment due — Custom Order #${order.id}`,
		html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; background: #F5EFE4; padding: 32px;">
        <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8B6842; text-align: center; margin: 0 0 8px;">Custom Order #${
					order.id
				}</p>
        <h1 style="font-weight: 300; color: #2C1F14; text-align: center; margin: 0 0 16px; font-size: 24px;">Your piece is ready for dispatch</h1>
        <p style="color: #5C3D24; font-size: 14px; line-height: 1.8; text-align: center; margin: 0 0 8px;">
          Hi ${order.customerName}, your ${
			order.bagStyle
		} is finished and ready to ship.
        </p>
        <p style="font-size: 22px; font-weight: 600; color: #2C1F14; text-align: center; margin: 20px 0;">
          Balance due: R ${order.balanceAmount.toLocaleString("en-ZA")}
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${
						order.paymentUrl
					}" style="background: #B05E3A; color: #FDFAF5; padding: 13px 36px; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
            Pay Balance Now
          </a>
        </div>
        <p style="color: #5C3D24; font-size: 13px; text-align: center; margin-top: 24px;">
          Your order will be dispatched once payment is received.
        </p>
      </div>
    `,
	});
}

export async function sendOrderShippedEmail(order: {
	id: number;
	customerName: string;
	customerEmail: string;
	trackingNumber: string | null;
	shippingMethod: string;
}) {
	const trackingUrl = order.trackingNumber
		? `https://thecourierguy.co.za/tracking/?waybill=${order.trackingNumber}`
		: null;

	return resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL!,
		to: order.customerEmail,
		subject: `Your order #${order.id} has been shipped — Tjiane Creations`,
		html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; background: #F5EFE4; padding: 32px;">
        <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8B6842; text-align: center; margin: 0 0 8px;">Order #${
					order.id
				}</p>
        <h1 style="font-weight: 300; color: #2C1F14; text-align: center; margin: 0 0 24px; font-size: 24px;">Your order is on its way</h1>
        <p style="color: #5C3D24; font-size: 14px; line-height: 1.8; text-align: center; margin: 0 0 24px;">
          Hi ${order.customerName}, your order has been handed to
          ${order.shippingMethod.replace("_", " ")} and is on its way to you.
        </p>
        ${
					trackingUrl
						? `
        <div style="text-align: center; margin: 24px 0;">
          <p style="color: #2C1F14; font-size: 14px; margin: 0 0 8px;">
            Tracking number: <strong>${order.trackingNumber}</strong>
          </p>
          <a href="${trackingUrl}" style="background: #B05E3A; color: #FDFAF5; padding: 12px 28px; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; display: inline-block;">
            Track your parcel
          </a>
        </div>`
						: ""
				}
        <p style="text-align: center; font-size: 11px; color: #8B6842; margin-top: 32px;">
          Tjiane Creations · Handcrafted in Brakpan, South Africa
        </p>
      </div>
    `,
	});
}
