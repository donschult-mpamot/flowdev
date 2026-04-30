import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Allow workspace imports to be transpiled.
  transpilePackages: [
    "@flowdev/db",
    "@flowdev/shared",
    "@flowdev/connectors",
  ],
  // Resolve ".js" import specifiers in workspace sources. Compiled `dist/*.js`
  // wins; `.ts`/`.tsx` are fallbacks for any source-condition consumer.
  webpack(config) {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".js", ".ts", ".tsx"],
    };
    return config;
  },
};

export default nextConfig;
