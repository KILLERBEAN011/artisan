import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/admin/"], // Keeps Google out of private areas
    },
    sitemap: "https://naijacraft.com.ng/sitemap.xml",
  };
}
