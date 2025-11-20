import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Ignore test files from dependencies
    config.module.rules.push({
      test: /node_modules.*\.(test|spec)\.(js|ts|tsx)$/,
      loader: 'ignore-loader',
    });
    return config;
  },
};

export default nextConfig;
