import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // API routes use node:crypto; keep the Node.js runtime explicit per route.
  },
};

export default nextConfig;
