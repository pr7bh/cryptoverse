export const PORTFOLIO_KEY = 'cv_portfolio_v2';

export const loadPortfolios = () => {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
};

export const savePortfolios = (data) => {
  try { localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(data)); } catch (e) {}
};

export const DEFAULT_PORTFOLIO = () => ({
  id: Date.now().toString(),
  name: 'My Portfolio',
  transactions: [],
  createdAt: new Date().toISOString(),
});

export const DEFAULT_STATE = () => {
  const p = DEFAULT_PORTFOLIO();
  return { portfolios: [p], activeId: p.id };
};

export const calcHoldings = (transactions) => {
  const map = {};
  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach(tx => {
    if (!map[tx.coinId]) {
      map[tx.coinId] = {
        coinId: tx.coinId,
        coinSymbol: tx.coinSymbol,
        coinName: tx.coinName,
        coinImage: tx.coinImage,
        quantity: 0,
        totalCost: 0,
        realizedPnl: 0,
        buyCount: 0,
        sellCount: 0,
      };
    }
    const h = map[tx.coinId];
    if (tx.type === 'buy') {
      h.totalCost += (tx.quantity * tx.pricePerCoin) + (tx.fee || 0);
      h.quantity += tx.quantity;
      h.buyCount++;
    } else {
      const wac = h.quantity > 0 ? h.totalCost / h.quantity : 0;
      const proceeds = (tx.quantity * tx.pricePerCoin) - (tx.fee || 0);
      h.realizedPnl += proceeds - (wac * tx.quantity);
      h.totalCost = Math.max(0, h.totalCost - (wac * tx.quantity));
      h.quantity = Math.max(0, h.quantity - tx.quantity);
      h.sellCount++;
    }
  });

  return Object.values(map);
};

export const calcPortfolioSummary = (holdings, prices, symbol) => {
  let totalValue = 0, totalCost = 0, totalRealized = 0;
  const enriched = holdings.map(h => {
    const price = (prices && prices[h.coinId]) || 0;
    const value = h.quantity * price;
    const cost = h.quantity > 0 ? h.totalCost : 0;
    const avgCost = h.quantity > 0 ? h.totalCost / h.quantity : 0;
    const unrealizedPnl = value - cost;
    const unrealizedPct = cost > 0 ? (unrealizedPnl / cost) * 100 : 0;
    totalValue += value;
    totalCost += cost;
    totalRealized += h.realizedPnl;
    return { ...h, price, value, cost, avgCost, unrealizedPnl, unrealizedPct };
  }).filter(h => h.quantity > 0 || h.realizedPnl !== 0);

  const totalUnrealized = totalValue - totalCost;
  const totalPct = totalCost > 0 ? (totalUnrealized / totalCost) * 100 : 0;

  return { enriched, totalValue, totalCost, totalUnrealized, totalPct, totalRealized };
};
