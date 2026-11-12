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
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
};

export default nextConfig;
