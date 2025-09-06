/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' }
    ]
  },
  // ensure server can import native/wasm libs without bundling issues
  serverExternalPackages: ['@resvg/resvg-js'],
};
export default nextConfig;