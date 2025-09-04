// inside export const metadata:
export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Movie Ratings Finder',
  description: 'Search movies → see IMDb + Rotten Tomatoes (when available).',
  openGraph: {
    title: 'Movie Ratings Finder',
    description: 'Only the ratings that matter — by RONNY',
    images: ['/api/og'], // generic; per-movie OG is a next step
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movie Ratings Finder',
    description: 'Only the ratings that matter — by RONNY',
    images: ['/api/og'],
  },
};