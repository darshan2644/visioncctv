import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: ["10.132.124.5", "localhost:3000"],
  },
};

export default nextConfig;

