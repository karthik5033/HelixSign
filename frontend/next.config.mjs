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
    const backendUrl = (process.env.BACKEND_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const mlUrl = (process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/ml/:path*',
        destination: `${mlUrl}/ml/:path*`,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
};

export default nextConfig;
