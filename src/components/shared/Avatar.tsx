type Props = {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASSES = {
  sm: "h-16 w-16",
  md: "h-20 w-20",
  lg: "h-24 w-24",
};

export function Avatar({ src, alt, size = "sm" }: Props) {
  const sizeClass = SIZE_CLASSES[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URLs, not a local asset
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`${sizeClass} shrink-0 rounded-full bg-gradient-to-br from-navy-800 to-brand-green-700`}
    />
  );
}
