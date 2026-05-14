import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  serverExternalPackages: ["@react-pdf/renderer", "pdf-parse", "canvas"]
};

export default nextConfig;
