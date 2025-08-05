/** @type {import('next').NextConfig} */
const nextConfig = {
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
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

module.exports = nextConfig;
