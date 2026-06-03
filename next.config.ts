import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating dev badge so it doesn't overlap the sidebar / footers.
  devIndicators: false,
  images: {
    // Dummy imagery sources for demo/dev. Swap for the real CDN before launch.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
