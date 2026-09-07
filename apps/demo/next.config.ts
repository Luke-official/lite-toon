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
  images: {
    remotePatterns: [
      { hostname: "*.ngrok-free.app" },
      { hostname: "*.ngrok.io" },
      { hostname: "*.ngrok.app" }
    ]
  },
  // Custom property handled by Next.js middleware / server actions
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
    ...extraDevOrigins,
  ],
};

export default nextConfig;
