import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/armador",
        "/armador/",
        "/supervisor",
        "/supervisor/",
        "/inicio",
      ],
    },
    sitemap: "https://www.armados2go.com/sitemap.xml",
  };
}
