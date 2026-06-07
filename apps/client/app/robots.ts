import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/cart",
        "/checkout",
        "/compare",
        "/favorites",
        "/login",
        "/orders",
        "/profile",
        "/register",
        "/seller",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
