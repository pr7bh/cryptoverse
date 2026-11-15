module.exports = async function handler(req, res) {
  const urlStr = req.url || '';
  const questionIdx = urlStr.indexOf('?');
  const fullPath = questionIdx >= 0 ? urlStr.slice(0, questionIdx) : urlStr;
  const queryStr = questionIdx >= 0 ? urlStr.slice(questionIdx + 1) : '';

  // Strip /api/cg/ prefix added by the rewrite rule
  const cgPath = fullPath.replace(/^\/api\/cg\//, '').replace(/^\/api\/cgproxy.*/, '');
  const targetUrl = `https://api.coingecko.com/api/v3/${cgPath}${queryStr ? '?' + queryStr : ''}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const upstream = await fetch(targetUrl, { headers: { Accept: 'application/json' } });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Upstream request failed', url: targetUrl });
  }
};
