"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

type Props = {
  currentImageUrl?: string;
  onUploaded: (url: string) => void;
  shape?: "circle" | "square";
  label?: string;
};

const MAX_FILE_SIZE_MB = 5;

export function ImageUpload({
  currentImageUrl,
  onUploaded,
  shape = "circle",
  label = "Upload photo",
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError("Image uploads aren't configured yet — missing Cloudinary settings.");
      return;
    }

    // Show an instant local preview while the real upload happens in the background.
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      setPreview(data.secure_url);
      onUploaded(data.secure_url);
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  const previewShapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-navy-800 to-brand-green-700 ${previewShapeClass}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URLs, not a local asset
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div>
        <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-cloud-200 px-3 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading..." : label}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
