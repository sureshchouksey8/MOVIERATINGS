import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Movie Ratings Finder';
  const imdb = searchParams.get('imdb') || '';
  const rt = searchParams.get('rt') || '';
  // Simple, brand-forward card. (We can add poster support later.)
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          background:
            'linear-gradient(135deg, #0f172a 0%, #111827 40%, #0b1020 100%)',
          color: '#e5e7eb',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ marginTop: 18, fontSize: 28, color: '#cbd5e1' }}>
          {imdb && `IMDb: ${imdb}`} {imdb && rt && ' • '} {rt && `Rotten Tomatoes: ${rt}`}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 28,
            fontWeight: 600,
            background:
              'linear-gradient(90deg,#f472b6,#f59e0b,#34d399,#60a5fa,#a78bfa,#f472b6)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Only the ratings that matter — by RONNY
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}