import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@lite-toon/bridge",
    "@lite-toon/core",
    "@lite-toon/toon",
    "@lite-toon/adapter-next",
  ],
};

export default nextConfig;
