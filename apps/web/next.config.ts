import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Monorepo: pin root so Next does not pick a parent lockfile
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
