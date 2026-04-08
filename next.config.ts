import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from resolving modules from the parent workspace folder.
    root: process.cwd(),
  },
};

export default nextConfig;
