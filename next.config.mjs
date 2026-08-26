const backendBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/api/v1').replace(/\/api\/v1\/?$/, '');

const nextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/v1/* requests from Next.js → Spring Boot backend
        // This prevents CORS and ERR_CONNECTION_REFUSED
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
