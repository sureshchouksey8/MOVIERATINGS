const buckets = new Map<string, { count: number; reset: number }>();

function getIp(req: Request) {
  const h = req.headers;
  return (
    h.get('x-nf-client-connection-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    '0.0.0.0'
  );
}

/** limit: requests per minute */
export function limitOrThrow(req: Request, key: string, limit = 120) {
  const ip = getIp(req);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const win = 60_000;

  let b = buckets.get(bucketKey);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + win };
    buckets.set(bucketKey, b);
  }
  b.count++;
  if (b.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((b.reset - now) / 1000));
    const err: any = new Error('Rate limit exceeded');
    err.status = 429;
    err.headers = { 'Retry-After': String(retryAfter) };
    throw err;
  }
}