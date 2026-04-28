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
  // Resolve ".js" import specifiers in workspace TS sources to their ".ts"
  // siblings. Required because apps/worker + apps/jobs use TypeScript NodeNext
  // (which mandates explicit .js extensions on relative imports), so the
  // packages/* source files write `./cn.js` etc. — webpack can't follow that
  // back to ./cn.ts without this alias.
  webpack(config) {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
  // Turbopack (dev server) needs the same extension alias.
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    resolveAlias: {},
  },
};

export default nextConfig;
