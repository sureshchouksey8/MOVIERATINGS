import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' }
    ]
  },
  // We use Node runtime in API routes (env vars, long fetches, etc.)
  experimental: { serverActions: { allowedOrigins: ['*'] } }
};
export default nextConfig;
