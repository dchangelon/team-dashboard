import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "trello-members.s3.amazonaws.com" },
      { protocol: "https", hostname: "trello-avatars.s3.amazonaws.com" },
    ],
  },
};

export default nextConfig;
