"use client";

import { useId, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { MAX_PHOTO_MB, cloudinaryThumb, uploadImageToCloudinary } from "@/lib/cloudinary-upload";

type Props = {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
  label: string;
  hint?: string;
  folder?: string;
};

/**
 * Several photos: upload, remove, and choose the cover (the first photo is the
 * cover shown on product cards).
 */
export function PhotoUploader({ photos, onChange, max = 8, label, hint, folder }: Props) {
  const inputId = useId();
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const room = max - photos.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const files = Array.from(fileList).slice(0, Math.max(room, 0));
    if (fileList.length > room) {
      setError(`You can add up to ${max} photos. Only the first ${room} were added.`);
    }
    if (files.length === 0) return;

    setUploading((n) => n + files.length);
    const results = await Promise.allSettled(files.map((f) => uploadImageToCloudinary(f, folder)));
    setUploading((n) => n - files.length);

    const urls: string[] = [];
    const problems: string[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") urls.push(r.value);
      else problems.push(r.reason instanceof Error ? r.reason.message : "A photo failed to upload.");
    }
    if (urls.length) onChange([...photos, ...urls].slice(0, max));
    if (problems.length) setError(problems.join(" "));
  }

  const remove = (i: number) => onChange(photos.filter((_, idx) => idx !== i));
  const makeCover = (i: number) => onChange([photos[i], ...photos.filter((_, idx) => idx !== i)]);

  return (
    <div>
      <p className="text-sm font-semibold text-navy-900">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}

      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((src, i) => (
          <li key={src} className="relative aspect-square overflow-hidden rounded-xl bg-cloud-100 ring-1 ring-cloud-200">
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail */}
            <img src={cloudinaryThumb(src, 300)} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 ? (
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-navy-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                Cover
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(i)}
                className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-navy-900 shadow-sm hover:bg-white"
              >
                <Star className="h-3 w-3" aria-hidden="true" /> Make cover
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-sm hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}

        {Array.from({ length: uploading }).map((_, i) => (
          <li key={`up-${i}`} className="flex aspect-square items-center justify-center rounded-xl bg-cloud-100 ring-1 ring-cloud-200">
            <Loader2 className="h-6 w-6 animate-spin text-brand-green-600" aria-label="Uploading" />
          </li>
        ))}

        {room - uploading > 0 && (
          <li>
            <label
              htmlFor={inputId}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-cloud-200 bg-white text-center text-xs font-semibold text-ink-700 transition-colors hover:border-brand-green-500 hover:bg-brand-green-100/40"
            >
              <ImagePlus className="h-6 w-6 text-brand-green-600" aria-hidden="true" />
              Add photo{max > 1 ? "s" : ""}
            </label>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              multiple={max > 1}
              className="sr-only"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </li>
        )}
      </ul>

      <p className="mt-2 text-xs text-ink-500">
        {photos.length}/{max} · JPG or PNG, up to {MAX_PHOTO_MB}MB each
      </p>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
