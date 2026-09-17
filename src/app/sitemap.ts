import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://naijacraft.com.ng",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://naijacraft.com.ng/search",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    // You can dynamically fetch and map artisan profile URLs here later!
  ];
}
