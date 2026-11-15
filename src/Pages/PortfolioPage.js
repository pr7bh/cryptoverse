import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { usePortfolio } from '../features/portfolio/PortfolioContext';
import { calcHoldings, calcPortfolioSummary, DEFAULT_PORTFOLIO } from '../features/portfolio/portfolioUtils';
import { CryptoState } from '../CryptoContext';
import { useTheme } from '../theme/ThemeContext';
import { numberWithCommas } from '../utils/format';
import './PortfolioPage.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const BASE = process.env.NODE_ENV === 'production' ? '/api/cg' : 'https://api.coingecko.com/api/v3';

const CHART_COLORS = ['#B9F36B','#9B8CFF','#00D6A3','#FF5570','#F0A500','#5B9CF6','#FF8C69','#C084FC','#34D399','#FB923C'];

const fmt = (n, sym) => sym + numberWithCommas(Number(n || 0).toFixed(2));
const fmtPct = (n) => (n >= 0 ? '+' : '') + Number(n || 0).toFixed(2) + '%';

const PortfolioPage = () => {
  const { state, dispatch, activePortfolio } = usePortfolio();
  const { currency, symbol } = CryptoState();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [prices, setPrices] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [coinSearch, setCoinSearch] = useState('');
  const [coinSuggestions, setCoinSuggestions] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [txType, setTxType] = useState('buy');
  const [txQty, setTxQty] = useState('');
  const [txPrice, setTxPrice] = useState('');
  const [txFee, setTxFee] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);
  const searchTimeout = useRef(null);

  const transactions = activePortfolio ? activePortfolio.transactions : [];
  const holdings = calcHoldings(transactions);
  const summary = calcPortfolioSummary(holdings, prices, symbol);

  const holdingIds = holdings.filter(h => h.quantity > 0).map(h => h.coinId).join(',');

  const fetchPrices = useCallback(() => {
    if (!holdingIds) return;
    setPriceLoading(true);
    const curr = currency.toLowerCase();
    axios.get(BASE + '/simple/price?ids=' + holdingIds + '&vs_currencies=' + curr)
      .then(function(res) {
        const data = res.data;
        const map = {};
        holdingIds.split(',').forEach(function(id) {
          if (data[id]) map[id] = data[id][curr] || 0;
        });
        setPrices(map);
      })
      .catch(function() {})
      .finally(function() { setPriceLoading(false); });
  }, [holdingIds, currency]);

  useEffect(function() { fetchPrices(); }, [fetchPrices]);

  const searchCoins = useCallback(function(q) {
    if (!q || q.length < 2) { setCoinSuggestions([]); return; }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(function() {
      axios.get(BASE + '/search?query=' + encodeURIComponent(q))
        .then(function(res) {
          const coins = (res.data.coins || []).slice(0, 6);
          setCoinSuggestions(coins);
        })
        .catch(function() {});
    }, 350);
  }, []);

  useEffect(function() { searchCoins(coinSearch); }, [coinSearch, searchCoins]);

  const handleSelectCoin = function(coin) {
    setSelectedCoin({
      coinId: coin.id,
      coinName: coin.name,
      coinSymbol: (coin.symbol || '').toUpperCase(),
      coinImage: coin.large || coin.thumb || '',
    });
    setCoinSearch(coin.name);
    setCoinSuggestions([]);
    const curr = currency.toLowerCase();
    axios.get(BASE + '/simple/price?ids=' + coin.id + '&vs_currencies=' + curr)
      .then(function(res) {
        const data = res.data;
        if (data[coin.id] && data[coin.id][curr]) setTxPrice(String(data[coin.id][curr]));
      })
      .catch(function() {});
  };

  const handleAddTransaction = function(e) {
    e.preventDefault();
    if (!selectedCoin || !txQty || !txPrice) return;
    const tx = Object.assign({}, selectedCoin, {
      id: Date.now().toString(),
      type: txType,
      quantity: parseFloat(txQty),
      pricePerCoin: parseFloat(txPrice),
      fee: parseFloat(txFee) || 0,
      date: txDate,
      notes: txNotes,
    });
    dispatch({ type: 'ADD_TRANSACTION', tx: tx });
    setShowModal(false);
    setSelectedCoin(null);
    setCoinSearch('');
    setTxQty(''); setTxPrice(''); setTxFee(''); setTxNotes('');
    setTxType('buy');
    setTxDate(new Date().toISOString().split('T')[0]);
  };

  const addPortfolio = function() {
    const p = DEFAULT_PORTFOLIO();
    p.name = 'Portfolio ' + (state.portfolios.length + 1);
    dispatch({ type: 'ADD_PORTFOLIO', portfolio: p });
  };

  const activeHoldings = summary.enriched.filter(function(h) { return h.quantity > 0; });

  const donutData = {
    labels: activeHoldings.map(function(h) { return h.coinSymbol; }),
    datasets: [{
      data: activeHoldings.map(function(h) { return h.value; }),
      backgroundColor: CHART_COLORS,
      borderColor: isDark ? '#0D1118' : '#FFFFFF',
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const donutOptions = {
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(13,17,24,0.97)' : 'rgba(255,255,255,0.98)',
        titleColor: isDark ? '#8993A4' : '#64748B',
        bodyColor: isDark ? '#F5F7FA' : '#111827',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
        borderWidth: 1,
        callbacks: {
          label: function(ctx) { return ' ' + symbol + numberWithCommas(ctx.parsed.toFixed(2)) + ' (' + ctx.label + ')'; },
        },
      },
    },
    maintainAspectRatio: false,
  };

  const statCards = [
    { label: 'Portfolio Value', value: fmt(summary.totalValue, symbol), sub: fmtPct(summary.totalPct) + ' overall', color: summary.totalPct >= 0 ? 'pos' : 'neg' },
    { label: 'Total Invested', value: fmt(summary.totalCost, symbol), sub: transactions.length + ' transaction' + (transactions.length !== 1 ? 's' : ''), color: 'neutral' },
    { label: 'Unrealized P&L', value: fmt(summary.totalUnrealized, symbol), sub: fmtPct(summary.totalPct), color: summary.totalUnrealized >= 0 ? 'pos' : 'neg' },
    { label: 'Realized P&L', value: fmt(summary.totalRealized, symbol), sub: 'From closed positions', color: summary.totalRealized >= 0 ? 'pos' : 'neg' },
  ];

  return (
    <div className="pf-page">
      <div className="pf-topbar">
        <div className="pf-topbar__inner">
          <div className="pf-tabs">
            {state.portfolios.map(function(p) {
              return (
                <button
                  key={p.id}
                  className={'pf-tab' + (state.activeId === p.id ? ' active' : '')}
                  onClick={function() { dispatch({ type: 'SWITCH_PORTFOLIO', id: p.id }); }}
                >{p.name}</button>
              );
            })}
            <button className="pf-tab pf-tab--add" onClick={addPortfolio}>+ New</button>
          </div>
          <button className="pf-add-btn" onClick={function() { setShowModal(true); }}>+ Add Transaction</button>
        </div>
      </div>

      <div className="pf-inner">
        <div className="pf-summary">
          {statCards.map(function(s) {
            return (
              <div key={s.label} className={'pf-stat-card pf-stat-card--' + s.color}>
                <div className="pf-stat-card__label">{s.label}</div>
                <div className="pf-stat-card__value">{s.value}</div>
                <div className={'pf-stat-card__sub ' + s.color}>{s.sub}</div>
              </div>
            );
          })}
        </div>

        <div className="pf-main-row">
          <div className="pf-holdings">
            <div className="pf-section-title">
              Holdings {priceLoading && <span className="pf-loading-dot" />}
            </div>
            {activeHoldings.length === 0 ? (
              <div className="pf-empty">No holdings yet. Add your first transaction above.</div>
            ) : (
              <div className="pf-table-wrap">
                <table className="pf-table">
                  <thead>
                    <tr>
                      {['Asset', 'Quantity', 'Avg Cost', 'Price', 'Value', 'P&L', 'P&L %'].map(function(h) {
                        return <th key={h} className="pf-th">{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {activeHoldings.map(function(h) {
                      return (
                        <tr key={h.coinId} className="pf-row">
                          <td className="pf-td pf-td--asset">
                            {h.coinImage && <img src={h.coinImage} alt={h.coinName} className="pf-coin-img" />}
                            <div>
                              <div className="pf-coin-sym">{h.coinSymbol}</div>
                              <div className="pf-coin-name">{h.coinName}</div>
                            </div>
                          </td>
                          <td className="pf-td pf-td--num">{h.quantity.toFixed(6).replace(/\.?0+$/, '')}</td>
                          <td className="pf-td pf-td--num">{fmt(h.avgCost, symbol)}</td>
                          <td className="pf-td pf-td--num">{h.price ? fmt(h.price, symbol) : '—'}</td>
                          <td className="pf-td pf-td--num">{h.price ? fmt(h.value, symbol) : '—'}</td>
                          <td className={'pf-td pf-td--num ' + (h.unrealizedPnl >= 0 ? 'pos' : 'neg')}>
                            {h.price ? fmt(h.unrealizedPnl, symbol) : '—'}
                          </td>
                          <td className={'pf-td pf-td--num ' + (h.unrealizedPct >= 0 ? 'pos' : 'neg')}>
                            {h.price ? fmtPct(h.unrealizedPct) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {activeHoldings.length > 0 && (
            <div className="pf-allocation">
              <div className="pf-section-title">Allocation</div>
              <div className="pf-donut-wrap">
                <Doughnut data={donutData} options={donutOptions} />
                <div className="pf-donut-center">
                  <div className="pf-donut-label">Total</div>
                  <div className="pf-donut-value">{fmt(summary.totalValue, symbol)}</div>
                </div>
              </div>
              <div className="pf-legend">
                {activeHoldings.map(function(h, i) {
                  return (
                    <div key={h.coinId} className="pf-legend-item">
                      <span className="pf-legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="pf-legend-sym">{h.coinSymbol}</span>
                      <span className="pf-legend-pct">
                        {summary.totalValue > 0 ? ((h.value / summary.totalValue) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="pf-tx-section">
          <div className="pf-section-title">Transaction History</div>
          {transactions.length === 0 ? (
            <div className="pf-empty">No transactions recorded.</div>
          ) : (
            <div className="pf-table-wrap">
              <table className="pf-table">
                <thead>
                  <tr>
                    {['Date', 'Type', 'Asset', 'Quantity', 'Price', 'Fee', 'Notes', ''].map(function(h, i) {
                      return <th key={i} className="pf-th">{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[...transactions].sort(function(a, b) { return new Date(b.date) - new Date(a.date); }).map(function(tx) {
                    return (
                      <tr key={tx.id} className="pf-row">
                        <td className="pf-td">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="pf-td"><span className={'pf-type-badge ' + tx.type}>{tx.type.toUpperCase()}</span></td>
                        <td className="pf-td pf-td--asset">
                          {tx.coinImage && <img src={tx.coinImage} alt={tx.coinName} className="pf-coin-img" />}
                          <div>
                            <div className="pf-coin-sym">{tx.coinSymbol}</div>
                            <div className="pf-coin-name">{tx.coinName}</div>
                          </div>
                        </td>
                        <td className="pf-td pf-td--num">{tx.quantity}</td>
                        <td className="pf-td pf-td--num">{fmt(tx.pricePerCoin, symbol)}</td>
                        <td className="pf-td pf-td--num">{tx.fee ? fmt(tx.fee, symbol) : '—'}</td>
                        <td className="pf-td pf-td--muted">{tx.notes || '—'}</td>
                        <td className="pf-td">
                          <button className="pf-del-btn" onClick={function() { dispatch({ type: 'DELETE_TRANSACTION', id: tx.id }); }} title="Delete">✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="pf-modal-overlay" onClick={function(e) { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="pf-modal">
            <div className="pf-modal__header">
              <h3 className="pf-modal__title">Add Transaction</h3>
              <button className="pf-modal__close" onClick={function() { setShowModal(false); }}>✕</button>
            </div>
            <form className="pf-modal__form" onSubmit={handleAddTransaction}>
              <div className="pf-form-group">
                <label className="pf-label">Cryptocurrency</label>
                <div className="pf-search-wrap">
                  <input
                    className="pf-input"
                    type="text"
                    placeholder="Search (e.g. Bitcoin)"
                    value={coinSearch}
                    onChange={function(e) { setCoinSearch(e.target.value); setSelectedCoin(null); }}
                    autoComplete="off"
                  />
                  {coinSuggestions.length > 0 && (
                    <div className="pf-suggestions">
                      {coinSuggestions.map(function(c) {
                        return (
                          <button key={c.id} type="button" className="pf-suggestion" onClick={function() { handleSelectCoin(c); }}>
                            <img src={c.thumb} alt={c.name} className="pf-sug-img" />
                            <span className="pf-sug-name">{c.name}</span>
                            <span className="pf-sug-sym">{(c.symbol || '').toUpperCase()}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pf-form-group">
                <label className="pf-label">Type</label>
                <div className="pf-type-toggle">
                  <button type="button" className={'pf-type-btn' + (txType === 'buy' ? ' active buy' : '')} onClick={function() { setTxType('buy'); }}>Buy</button>
                  <button type="button" className={'pf-type-btn' + (txType === 'sell' ? ' active sell' : '')} onClick={function() { setTxType('sell'); }}>Sell</button>
                </div>
              </div>

              <div className="pf-form-row">
                <div className="pf-form-group">
                  <label className="pf-label">Quantity</label>
                  <input className="pf-input" type="number" step="any" min="0" placeholder="0.00" value={txQty} onChange={function(e) { setTxQty(e.target.value); }} required />
                </div>
                <div className="pf-form-group">
                  <label className="pf-label">Price per coin ({currency})</label>
                  <input className="pf-input" type="number" step="any" min="0" placeholder="0.00" value={txPrice} onChange={function(e) { setTxPrice(e.target.value); }} required />
                </div>
              </div>

              <div className="pf-form-row">
                <div className="pf-form-group">
                  <label className="pf-label">Fee ({currency})</label>
                  <input className="pf-input" type="number" step="any" min="0" placeholder="0.00" value={txFee} onChange={function(e) { setTxFee(e.target.value); }} />
                </div>
                <div className="pf-form-group">
                  <label className="pf-label">Date</label>
                  <input className="pf-input" type="date" value={txDate} onChange={function(e) { setTxDate(e.target.value); }} required />
                </div>
              </div>

              <div className="pf-form-group">
                <label className="pf-label">Notes (optional)</label>
                <input className="pf-input" type="text" placeholder="Optional note..." value={txNotes} onChange={function(e) { setTxNotes(e.target.value); }} />
              </div>

              {txQty && txPrice && (
                <div className="pf-total-preview">
                  Total: {symbol}{numberWithCommas((parseFloat(txQty) * parseFloat(txPrice) + (parseFloat(txFee) || 0)).toFixed(2))}
                </div>
              )}

              <div className="pf-modal__actions">
                <button type="button" className="pf-btn pf-btn--ghost" onClick={function() { setShowModal(false); }}>Cancel</button>
                <button type="submit" className={'pf-btn pf-btn--' + txType} disabled={!selectedCoin}>
                  {txType === 'buy' ? 'Record Buy' : 'Record Sell'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
