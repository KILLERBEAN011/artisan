"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/shared/ImageUpload";

export function PortfolioEditor({
  initialImages,
}: {
  initialImages: string[];
}) {
  const [images, setImages] = useState<string[]>(initialImages.slice(0, 3));
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function updateDatabase(newImages: string[]) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/artisans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioImages: newImages }),
      });

      if (res.ok) {
        setImages(newImages);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update portfolio", error);
    } finally {
      setIsSaving(false);
    }
  }

  const handleAdd = (url: string) => {
    if (images.length >= 3) return;
    updateDatabase([...images, url]);
  };

  const handleRemove = (indexToRemove: number) => {
    const newImages = images.filter((_, i) => i !== indexToRemove);
    updateDatabase(newImages);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-start gap-4">
        {images.map((url, i) => (
          <div
            key={i}
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-cloud-200 bg-cloud-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Work ${i + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              onClick={() => handleRemove(i)}
              disabled={isSaving}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm transition-colors hover:bg-white disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {images.length < 3 && (
          <div className="relative h-24 w-24 shrink-0">
            {isSaving ? (
              <div className="flex h-full w-full items-center justify-center rounded-xl border border-cloud-200 bg-cloud-50">
                <Loader2 className="h-5 w-5 animate-spin text-brand-green-600" />
              </div>
            ) : (
              <ImageUpload
                onUploaded={handleAdd}
                shape="square"
                label="Add work"
              />
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-500">
        {images.length}/3 images uploaded. Show off your best work.
      </p>
    </div>
  );
}
