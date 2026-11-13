/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Prevent Windows NTFS file-locking race conditions on temporary build manifests
      config.watchOptions = {
        aggregateTimeout: 300,
        poll: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/ml/:path*',
        destination: 'http://127.0.0.1:8000/ml/:path*',
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
};

export default nextConfig;
