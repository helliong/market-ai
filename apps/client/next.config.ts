import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    localPatterns: [
      {
        pathname: "/**",
        search: "",
      },
      {
        pathname: "/aviasales-ad-header.png",
        search: "?v=20260603-2",
      },
    ],
  },
};

export default nextConfig;
