/** @type {import('next').NextConfig} */
const backendBaseUrl = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://phurarmacy-pos-backend-2sip.onrender.com').replace(/\/api\/v1\/?$/, '');

const nextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/v1/* requests from Next.js → Spring Boot backend
        // This eliminates all CORS issues on both localhost and Vercel
        source: '/api/v1/:path*',
        destination: `${backendBaseUrl}/api/v1/:path*`,
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
