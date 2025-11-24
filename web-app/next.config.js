/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: 'api-gateway',
      },
      {
        protocol: 'http',
        hostname: 'pet-service',
      },
    ],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
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
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['axios'],
  },
};

module.exports = nextConfig;
