"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-[20px] border border-cloud-200 bg-white">
        {current && (
          <Image
            src={current}
            alt={`${name}, photo ${active + 1} of ${images.length}`}
            fill
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-contain"
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === active}
              className={`relative aspect-square overflow-hidden rounded-xl bg-white transition ${
                i === active
                  ? "ring-2 ring-navy-900"
                  : "ring-1 ring-cloud-200 hover:ring-ink-300"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
