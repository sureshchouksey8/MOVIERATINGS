/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' }
    ]
  },
  experimental: { serverActions: { allowedOrigins: ['*'] } },

  // IMPORTANT: keep Resvg external so Netlify includes it in node_modules for the function
  serverExternalPackages: ['@resvg/resvg-js'],
};
export default nextConfig;