// In production (Vercel), route through the serverless proxy to avoid CORS.
// In local dev, call CoinGecko directly (localhost is not blocked).
const BASE = process.env.NODE_ENV === 'production'
  ? '/api/cg'
  : 'https://api.coingecko.com/api/v3';

export const CoinList = (currency) =>
  `${BASE}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=1&sparkline=true`;

export const SingleCoin = (id) =>
  `${BASE}/coins/${id}`;

export const HistoricalChart = (id, days = 365, currency) =>
  `${BASE}/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`;

export const TrendingCoins = (currency) =>
  `${BASE}/coins/markets?vs_currency=${currency}&order=gecko_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`;
