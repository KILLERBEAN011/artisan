"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/shared/ImageUpload";

export function ProfilePhotoForm({ currentAvatarUrl }: { currentAvatarUrl: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleUploaded(url: string) {
    setError(null);
    setSaved(false);

    const res = await fetch("/api/artisans/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: url }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong saving your photo.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <ImageUpload
        currentImageUrl={currentAvatarUrl}
        onUploaded={handleUploaded}
        shape="circle"
        label={currentAvatarUrl ? "Change photo" : "Upload photo"}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="mt-2 text-sm text-brand-green-700">Saved.</p>}
    </div>
  );
}
