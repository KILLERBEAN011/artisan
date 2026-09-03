import type { Artisan, RecentJob } from "@/types/artisan";

// This mirrors what /api/artisans actually returns: a lean Mongoose document
// with populated userId, not the flat mock-data shape. Keeping this separate
// from the `Artisan` UI type makes it obvious which one is "wire format" vs
// "what components render."
export type ApiArtisan = {
  _id: string;
  userId: { _id: string; name: string } | null;
  title: string;
  serviceTitle: string;
  bio: string;
  categories: string[];
  subservices: string[];
  languages: string[];
  fromPriceNaira: number;
  turnaround?: string;
  responseTime?: string;
  availability?: string;
  location: { city: string; state: string };
  verification: string[];
  sellerType: "independent" | "company";
  rating: number;
  reviewCount: number;
  recentJobs: {
    label: string;
    amountNaira: number;
    status: "completed" | "in-progress";
    photoUrl?: string;
  }[];
  avatarUrl?: string;
  isAvailable?: boolean;
};

function mapRecentJob(job: ApiArtisan["recentJobs"][number], index: number, artisanId: string): RecentJob {
  return {
    id: `${artisanId}-job-${index}`,
    label: job.label,
    amountNaira: job.amountNaira,
    status: job.status,
    photoAlt: job.photoUrl ? `Photo of ${job.label}` : `Recent job: ${job.label}`,
  };
}

export function mapApiArtisanToUi(doc: ApiArtisan): Artisan {
  return {
    id: doc._id,
    name: doc.userId?.name ?? "Artisan",
    title: doc.title,
    serviceTitle: doc.serviceTitle,
    responseTime: doc.responseTime ?? "",
    verified: doc.verification.length > 0,
    bio: doc.bio,
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    location: `${doc.location.city}, ${doc.location.state}`,
    fromPriceNaira: doc.fromPriceNaira,
    turnaround: doc.turnaround ?? "",
    availability: doc.availability ?? "",
    recentJobs: doc.recentJobs.map((job, i) => mapRecentJob(job, i, doc._id)),
    categories: doc.categories,
    subservices: doc.subservices,
    languages: doc.languages,
    verification: doc.verification,
    sellerType: doc.sellerType,
    avatarUrl: doc.avatarUrl ?? "",
    isAvailable: doc.isAvailable ?? true,
  };
}
