import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@aifitness/types",
    "@aifitness/workout-engine",
    "@aifitness/api-client",
  ],
};

export default nextConfig;
