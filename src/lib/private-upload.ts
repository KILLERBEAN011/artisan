import { v2 as cloudinary } from "cloudinary";

/* Server-only. Private Cloudinary files for sensitive documents (seller IDs).
   Uses the same CLOUDINARY_* keys as the chat image upload. */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const MAX_ID_MB = 8;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Uploads a file as a *private* Cloudinary asset. Returns its id and format, never a public link. */
export async function uploadPrivateDocument(file: File, folder: string) {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Upload the ID as a photo (JPG or PNG).");
  }
  if (file.size > MAX_ID_MB * 1024 * 1024) {
    throw new Error(`The ID photo must be under ${MAX_ID_MB}MB.`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ public_id: string; format: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ type: "private", folder, resource_type: "image" }, (error, res) => {
        if (error || !res) reject(error ?? new Error("Upload failed"));
        else resolve({ public_id: res.public_id, format: res.format });
      })
      .end(buffer);
  });
  return { publicId: result.public_id, format: result.format };
}

/** A link to a private file that stops working after `seconds` (admins only). */
export function privateDocumentLink(publicId: string, format: string, seconds = 300) {
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: "image",
    type: "private",
    expires_at: Math.floor(Date.now() / 1000) + seconds,
  });
}
