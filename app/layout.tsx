import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: process.env.SITE_NAME || 'Movie Ratings Finder',
  description: 'Search movies → see IMDb + Rotten Tomatoes (when available).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
