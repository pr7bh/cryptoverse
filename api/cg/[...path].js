export default async function handler(req, res) {
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : (path || '');
  const rawQuery = req.url.includes('?') ? req.url.split('?').slice(1).join('?') : '';
  const url = `https://api.coingecko.com/api/v3/${pathStr}${rawQuery ? '?' + rawQuery : ''}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Upstream request failed' });
  }
}
