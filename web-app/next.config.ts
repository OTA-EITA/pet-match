import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', '127.0.0.1', 'api-gateway', 'pet-service'],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.API_URL || 'http://api-gateway:8080/:path*',
      },
    ];
  },
  output: 'standalone',
  typescript: {
    // Type-check during build
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint during build
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Enable type-safe environment variables
    typedRoutes: true,
  },
};

export default nextConfig;
