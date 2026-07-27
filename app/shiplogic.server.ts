const BASE_URL = "https://api.shiplogic.com/v2";
const API_KEY = process.env.SHIPLOGIC_API_KEY ?? "";

const headers = {
	Authorization: `Bearer ${API_KEY}`,
	"Content-Type": "application/json",
};

// Get shipping rates between two addresses
export async function getRates({
	toSuburb,
	toCity,
	toPostal,
	toProvince,
	weight = 1,
	length = 30,
	width = 20,
	height = 15,
}: {
	toSuburb: string;
	toCity: string;
	toPostal: string;
	toProvince: string;
	weight?: number;
	length?: number;
	width?: number;
	height?: number;
}) {
	const res = await fetch(`${BASE_URL}/rates`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			collection_address: {
				street_address: process.env.COURIER_GUY_COLLECTION_ADDRESS,
				local_area: process.env.COURIER_GUY_COLLECTION_SUBURB,
				city: process.env.COURIER_GUY_COLLECTION_CITY,
				code: process.env.COURIER_GUY_COLLECTION_POSTAL,
				zone: process.env.COURIER_GUY_COLLECTION_PROVINCE,
				country: "South Africa",
			},
			delivery_address: {
				local_area: toSuburb,
				city: toCity,
				code: toPostal,
				zone: toProvince,
				country: "South Africa",
			},
			parcels: [
				{
					submitted_length_cm: length,
					submitted_width_cm: width,
					submitted_height_cm: height,
					submitted_weight_kg: weight,
				},
			],
		}),
	});

	return res.json();
}

// Create a waybill / shipment
export async function createShipment({
	orderId,
	customerName,
	customerPhone,
	customerEmail,
	deliveryAddress,
	deliverySuburb,
	deliveryCity,
	deliveryPostal,
	deliveryProvince,
	parcels = [
		{
			submitted_length_cm: 30,
			submitted_width_cm: 20,
			submitted_height_cm: 15,
			submitted_weight_kg: 1,
		},
	],
	serviceLevel = "LOX", // LOX = Local Overnight Express, LOF = Local Overnight Flyer
}: {
	orderId: number;
	customerName: string;
	customerPhone: string;
	customerEmail: string;
	deliveryAddress: string;
	deliverySuburb: string;
	deliveryCity: string;
	deliveryPostal: string;
	deliveryProvince: string;
	parcels?: any[];
	serviceLevel?: string;
}) {
	const res = await fetch(`${BASE_URL}/shipments`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			service_level_code: serviceLevel,
			custom_tracking_reference: `TJIANE-${orderId}`,
			collection_address: {
				street_address: process.env.COURIER_GUY_COLLECTION_ADDRESS,
				local_area: process.env.COURIER_GUY_COLLECTION_SUBURB,
				city: process.env.COURIER_GUY_COLLECTION_CITY,
				code: process.env.COURIER_GUY_COLLECTION_POSTAL,
				zone: process.env.COURIER_GUY_COLLECTION_PROVINCE,
				country: "South Africa",
			},
			collection_contact: {
				name: process.env.COURIER_GUY_CONTACT_NAME,
				mobile_number: process.env.COURIER_GUY_CONTACT_PHONE,
			},
			delivery_address: {
				street_address: deliveryAddress,
				local_area: deliverySuburb,
				city: deliveryCity,
				code: deliveryPostal,
				zone: deliveryProvince,
				country: "South Africa",
			},
			delivery_contact: {
				name: customerName,
				mobile_number: customerPhone,
				email: customerEmail,
			},
			parcels,
			opt_in_rates: [],
			opt_in_time_based_rates: [],
		}),
	});

	return res.json();
}

// Get waybill PDF URL
export async function getWaybillUrl(shipmentId: string) {
	const res = await fetch(`${BASE_URL}/shipments/${shipmentId}/waybill`, {
		headers,
	});
	return res.json();
}
