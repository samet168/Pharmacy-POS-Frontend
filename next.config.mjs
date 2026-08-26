/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/v1/* requests from Next.js → Spring Boot backend
        // This prevents ERR_CONNECTION_REFUSED when the browser calls /api/v1/...
        source: '/api/v1/:path*',
        destination: 'http://localhost:8081/api/v1/:path*',
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
