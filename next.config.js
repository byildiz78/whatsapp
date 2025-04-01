/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't include venom-bot on client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: false,
        crypto: false,
        http: false,
        https: false,
        ws: false,
        path: false,
        net: false,
        tls: false
      };
    }
    return config;
  },
  // Disable persistent caching to prevent ENOENT errors
  experimental: {
    // Disable webpack caching
    webpackBuildWorker: false
  },
  // Configure webpack caching
  generateBuildId: async () => {
    return 'build-' + Date.now();
  }
};

module.exports = nextConfig;