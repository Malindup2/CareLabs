import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Removing eslint ignore as it triggered a warning in your environment
  output: 'standalone', // Optimized for Docker
};

export default nextConfig;
