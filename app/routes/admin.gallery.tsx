import {
	json,
	redirect,
	unstable_parseMultipartFormData,
} from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import {
	useLoaderData,
	Form,
	useNavigation,
	useSearchParams,
} from "@remix-run/react";
import * as React from "react";
import fs from "fs";
import path from "path";
import { Trash2, Upload } from "lucide-react";
import AdminLayout from "~/components/_layout/admin";

const ITEM_FOLDERS = [
	{ label: "Book Cover (A5)", folder: "book-cover" },
	{ label: "Laptop Sleeve", folder: "laptop-sleeve" },
	{ label: "Bookmark", folder: "bookmark" },
	{ label: "Baby Shoes", folder: "baby-shoes" },
	{ label: "Key Holder (Africa Map)", folder: "key-holder" },
	{ label: "Bible Cover / Bag", folder: "bible-cover" },
	{ label: "Belt", folder: "belt" },
	{ label: "Other", folder: "other" },
];

const GALLERY_BASE = path.join(process.cwd(), "public/images/custom-examples");

function readFolder(folder: string): string[] {
	const dir = path.join(GALLERY_BASE, folder);
	try {
		return fs
			.readdirSync(dir)
			.filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
			.map((f) => `/images/custom-examples/${folder}/${f}`);
	} catch {
		return [];
	}
}

export async function loader() {
	// Ensure all folders exist
	for (const { folder } of ITEM_FOLDERS) {
		const dir = path.join(GALLERY_BASE, folder);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	}

	const gallery: Record<string, string[]> = {};
	for (const { folder } of ITEM_FOLDERS) {
		gallery[folder] = readFolder(folder);
	}

	return json({ gallery });
}

export async function action({ request }: ActionFunctionArgs) {
	const form = await unstable_parseMultipartFormData(
		request,
		async (part): Promise<string | File | null | undefined> => {
			if (part.filename !== undefined) {
				if (!part.filename || part.filename === "") {
					for await (const _ of part.data) {
						/* drain */
					}
					return "";
				}

				// Get the folder from the already-parsed text fields isn't possible here
				// so we write to a temp location and move in the action below
				const bytes: Uint8Array[] = [];
				for await (const chunk of part.data) bytes.push(chunk);
				const buffer = Buffer.concat(bytes);

				// Write directly to temp file named with a prefix we can find
				const tmpPath = path.join(
					process.cwd(),
					"public/images/custom-examples",
					`__tmp__${part.filename}`,
				);
				fs.writeFileSync(tmpPath, buffer);
				return `__tmp__${part.filename}`;
			}

			// Text field
			const chunks: Uint8Array[] = [];
			for await (const chunk of part.data) chunks.push(chunk);
			return Buffer.concat(chunks).toString("utf-8");
		},
	);

	const _action = form.get("_action") as string;
	const folder = form.get("folder") as string;

	const validFolder = ITEM_FOLDERS.find((f) => f.folder === folder);
	if (!validFolder) return json({ error: "Invalid folder" }, { status: 400 });

	const folderPath = path.join(GALLERY_BASE, folder);
	if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

	if (_action === "upload") {
		for (let i = 0; i < 5; i++) {
			const tmpFilename = form.get(`image_${i}`) as string | null;
			if (tmpFilename && tmpFilename.startsWith("__tmp__")) {
				const realFilename = tmpFilename.replace("__tmp__", "");
				const tmpPath = path.join(GALLERY_BASE, tmpFilename);
				const destPath = path.join(folderPath, realFilename);

				console.log("tmpPath:", tmpPath);
				console.log("destPath:", destPath);
				console.log("Tmp exists:", fs.existsSync(tmpPath));
				// list what's actually in GALLERY_BASE
				console.log("Files in GALLERY_BASE:", fs.readdirSync(GALLERY_BASE));
				if (fs.existsSync(tmpPath)) {
					fs.renameSync(tmpPath, destPath);
				}
			}
		}
	}

	if (_action === "delete") {
		const filename = form.get("filename") as string;
		const filePath = path.join(folderPath, filename);
		if (filePath.startsWith(GALLERY_BASE) && fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
		// Also clean up any orphaned tmp files
		return redirect(`/admin/gallery?folder=${folder}`);
	}

	return redirect(`/admin/gallery?folder=${folder}`);
}

export default function AdminGallery() {
	const { gallery } = useLoaderData<typeof loader>();
	const navigation = useNavigation();
	const isUploading = navigation.state === "submitting";
	const [searchParams] = useSearchParams();

	const [activeFolder, setActiveFolder] = React.useState(
		searchParams.get("folder") ?? ITEM_FOLDERS[0].folder,
	);

	const activeItem = ITEM_FOLDERS.find((f) => f.folder === activeFolder)!;
	const activeImages = gallery[activeFolder] ?? [];

	return (
		<AdminLayout>
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="font-display font-light text-3xl text-bark">
						Custom Examples Gallery
					</h1>
					<p className="text-sm text-bark-mid mt-1">
						Photos appear on the Custom Orders page when customers select an
						item type.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-[220px_1fr] gap-8 items-start">
				{/* Item type sidebar */}
				<div className="bg-white border border-tan/30 rounded overflow-hidden">
					{ITEM_FOLDERS.map(({ label, folder }) => (
						<button
							key={folder}
							onClick={() => {
								setActiveFolder(folder);
								window.history.replaceState(
									null,
									"",
									`/admin/gallery?folder=${folder}`,
								);
							}}
							className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-tan/20 last:border-0 cursor-pointer flex items-center justify-between ${
								activeFolder === folder
									? "bg-bark text-cream"
									: "text-bark-mid hover:bg-cream/50 hover:text-bark bg-white border-0"
							}`}
						>
							<span>{label}</span>
							<span
								className={`text-[0.68rem] px-1.5 py-0.5 rounded ${
									activeFolder === folder
										? "bg-white/20 text-cream"
										: "bg-tan/20 text-bark-mid"
								}`}
							>
								{(gallery[folder] ?? []).length}
							</span>
						</button>
					))}
				</div>

				{/* Main panel */}
				<div>
					<div className="flex items-center justify-between mb-5">
						<h2 className="font-display font-light text-xl text-bark">
							{activeItem.label}
						</h2>
						<span className="text-sm text-bark-mid">
							{activeImages.length} photo{activeImages.length !== 1 ? "s" : ""}
						</span>
					</div>

					{/* Upload form */}
					<Form
						method="post"
						encType="multipart/form-data"
						className="bg-white border border-tan/30 rounded p-5 mb-6"
					>
						<input type="hidden" name="_action" value="upload" />
						<input type="hidden" name="folder" value={activeFolder} />

						<p className="text-[0.7rem] tracking-[0.15em] uppercase text-bark-mid mb-3">
							Add Photos
						</p>
						<div className="grid grid-cols-5 gap-3 mb-3">
							{[0, 1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className="border-2 border-dashed border-tan/40 rounded p-3 text-center hover:border-tan transition-colors"
								>
									<input
										type="file"
										name={`image_${i}`}
										accept="image/jpeg,image/png,image/webp"
										className="w-full text-[0.62rem] text-bark-mid cursor-pointer"
									/>
								</div>
							))}
						</div>
						<button
							type="submit"
							disabled={isUploading}
							className="flex items-center gap-2 bg-accent text-cream px-5 py-2 text-[0.75rem] tracking-wide uppercase hover:bg-bark transition-colors cursor-pointer border-0 disabled:opacity-50"
						>
							<Upload size={14} />
							{isUploading ? "Uploading…" : "Upload Photos"}
						</button>
						<p className="text-[0.68rem] text-bark-mid mt-2">
							JPG, PNG or WebP — max 5MB each. Up to 5 at a time.
						</p>
					</Form>

					{/* Photo grid */}
					{activeImages.length > 0 ? (
						<div className="grid grid-cols-3 gap-4">
							{activeImages.map((src) => {
								const filename = src.split("/").pop()!;
								return (
									<div key={src} className="relative group">
										<img
											src={src}
											alt={filename}
											className="w-full aspect-square object-cover rounded border border-tan/20"
										/>
										{/* Delete button */}
										<Form method="post" encType="multipart/form-data">
											<input type="hidden" name="_action" value="delete" />
											<input type="hidden" name="folder" value={activeFolder} />
											<input type="hidden" name="filename" value={filename} />
											<button
												type="submit"
												className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-0 hover:bg-red-600"
												title="Delete photo"
												onClick={(e) => {
													if (!confirm("Delete this photo?"))
														e.preventDefault();
												}}
											>
												<Trash2 size={13} />
											</button>
										</Form>
									</div>
								);
							})}
						</div>
					) : (
						<div className="border border-tan/20 rounded p-12 text-center bg-white">
							<p className="font-display italic text-lg text-bark-mid mb-1">
								No photos yet
							</p>
							<p className="text-sm text-bark-mid/60">
								Upload photos of past {activeItem.label.toLowerCase()} work
								above.
							</p>
						</div>
					)}
				</div>
			</div>
		</AdminLayout>
	);
}
