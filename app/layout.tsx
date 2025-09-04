import './globals.css';
import type { Metadata } from 'next';
import VitalsReporter from '@/components/VitalsReporter';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Movie Ratings Finder',
  description: 'Search movies → see IMDb + Rotten Tomatoes (when available).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnects for faster LCP of posters and trailer embeds */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
      </head>
      <body>
        {children}
        <VitalsReporter />
      </body>
    </html>
  );
}