import type { NextConfig } from "next";

// `output: 'standalone'` only when explicitly requested (CI / Docker build).
// Local builds on Windows without elevated symlink rights fail otherwise.
const useStandalone = process.env.NEXT_STANDALONE === "1";

const nextConfig: NextConfig = {
  ...(useStandalone ? { output: "standalone" as const } : {}),
  serverExternalPackages: ["@auth/drizzle-adapter", "postgres", "drizzle-orm"],
  // Exclude cross-platform sharp binaries from output-file-tracing on Windows
  // builds — prevents EACCES during trace collection. CI/Linux builds keep
  // tracing intact.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/.pnpm/sharp@*/node_modules/@img/sharp-libvips-linux-*/**",
      "node_modules/.pnpm/sharp@*/node_modules/@img/sharp-linux-*/**",
      "node_modules/.pnpm/sharp@*/node_modules/@img/sharp-darwin-*/**",
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
