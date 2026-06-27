import type { NextConfig } from "next";

const extraDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  transpilePackages: [
    "@lite-toon/bridge",
    "@lite-toon/core",
    "@lite-toon/toon",
    "@lite-toon/adapter-next",
  ],
  // Required for ngrok / Claude OAuth in development (cross-origin to localhost).
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
    ...extraDevOrigins,
  ],
};

export default nextConfig;
