/* Browser-side photo upload to Cloudinary, using the same unsigned upload
   preset the rest of the site already uses (NEXT_PUBLIC_CLOUDINARY_*). */

export const MAX_PHOTO_MB = 8;

export async function uploadImageToCloudinary(file: File, folder?: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name}" isn't an image.`);
  }
  if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
    throw new Error(`"${file.name}" is over ${MAX_PHOTO_MB}MB. Try a smaller photo.`);
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error("Photo uploads aren't set up: Cloudinary settings are missing.");
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);
  if (folder) body.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || `Couldn't upload "${file.name}". Check your connection and try again.`);
  }
  return data.secure_url;
}

/** Smaller copy of a Cloudinary photo for thumbnails (other URLs are returned unchanged). */
export function cloudinaryThumb(url: string, width = 400) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", `/upload/c_fill,w_${width},h_${width},q_auto,f_auto/`)
    : url;
}
