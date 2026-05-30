import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/.venv/**', '**/nltk_data/**', '**/nltk_data_api/**', '**/models/**', '**/.next/**'],
    };
    return config;
  },
  turbopack: {},
  serverExternalPackages: ['pdfjs-dist'],
};

export default nextConfig;
