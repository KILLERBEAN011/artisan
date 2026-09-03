export type RecentJob = {
  id: string;
  label: string;
  amountNaira: number;
  status: "completed" | "in-progress";
  photoAlt: string;
};

export type SearchFilters = {
  query: string;
  location: string;
  serviceCategories: string[];
  subservices: string[];
  minPrice: number;
  maxPrice: number;
  availability: "any" | "24h" | "3d" | "custom";
  minRating: number | null;
  useGps: boolean;
  languages: string[];
  verification: string[];
  sellerType: "any" | "independent" | "company";
};

export const defaultFilters: SearchFilters = {
  query: "",
  location: "",
  serviceCategories: [],
  subservices: [],
  minPrice: 2500,
  maxPrice: 150000,
  availability: "any",
  minRating: null,
  useGps: false,
  languages: [],
  verification: [],
  sellerType: "any",
};

export type Artisan = {
  id: string;
  name: string;
  title: string;
  serviceTitle: string;
  responseTime: string;
  verified: boolean;
  bio: string;
  rating: number;
  reviewCount: number;
  location: string;
  fromPriceNaira: number;
  turnaround: string;
  availability: string;
  recentJobs: RecentJob[];
  categories: string[];
  subservices: string[];
  languages: string[];
  verification: string[];
  sellerType: "independent" | "company";
  avatarUrl: string;
  isAvailable: boolean;
  
};
