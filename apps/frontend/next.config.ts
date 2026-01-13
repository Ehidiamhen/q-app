import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.r2.cloudflarestorage.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            {
              protocol: 'https',
              hostname: 'images.q-app.tech',
          },
        ],
    },
    experimental: {
        typedRoutes: true,
    },
};

export default nextConfig;
