"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/shared/ImageUpload";

type Props = {
  field: "heroImageUrl" | "enterpriseImageUrl";
  currentUrl: string;
};

export function SiteImageForm({ field, currentUrl }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleUploaded(url: string) {
    setError(null);
    setSaved(false);

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: url }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong saving the image.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <ImageUpload
        currentImageUrl={currentUrl}
        onUploaded={handleUploaded}
        shape="square"
        label={currentUrl ? "Change image" : "Upload image"}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="mt-2 text-sm text-brand-green-700">Saved.</p>}
    </div>
  );
}
