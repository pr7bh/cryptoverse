import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { CoinList } from '../../config/api';
import { CryptoState } from '../../CryptoContext';
import { numberWithCommas } from '../../utils/format';
import { toggleWatchlist, getWatchlist } from '../../utils/watchlist';
import gsap from 'gsap';
import './CoinsTable.css';

const COLUMNS = ['#', 'Asset', 'Price', '24H', '7D', 'Market Cap', '★'];

const Sparkline = ({ prices, isPositive }) => {
  if (!prices || prices.length < 2) return null;
  const w = 80, h = 32;
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices
    .filter((_, i) => i % Math.max(1, Math.floor(prices.length / 40)) === 0)
    .map((p, i, arr) => {
      const x = (i / (arr.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  const color = isPositive ? '#00D6A3' : '#FF5570';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
};

const CoinsTable = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [watchlist, setWatchlist] = useState(getWatchlist());
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const { currency, symbol } = CryptoState();
  const history = useHistory();
  const tableRef = useRef(null);

  const fetchCoins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(CoinList(currency));
      setCoins(data);
    } catch (e) {
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => { fetchCoins(); }, [fetchCoins]);

  useEffect(() => {
    if (!loading && coins.length && tableRef.current) {
      const rows = tableRef.current.querySelectorAll('.coins-row');
      gsap.fromTo(rows, { opacity: 0, x: -8 }, { opacity: 1, x: 0, stagger: 0.015, duration: 0.4, ease: 'power2.out' });
    }
  }, [loading, coins, page]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleWatchlist = (e, id) => {
    e.stopPropagation();
    const next = toggleWatchlist(id);
    setWatchlist(next);
  };

  const filtered = coins.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase());
    const matchWatchlist = watchlistOnly ? watchlist.includes(c.id) : true;
    return matchSearch && matchWatchlist;
  });

  const sorted = sortKey ? [...filtered].sort((a, b) => {
    const map = { Price: 'current_price', '24H': 'price_change_percentage_24h', 'Market Cap': 'market_cap' };
    const k = map[sortKey];
    if (!k) return 0;
    return sortDir === 'asc' ? a[k] - b[k] : b[k] - a[k];
  }) : filtered;

  const pageCount = Math.ceil(sorted.length / 10);
  const paged = sorted.slice((page - 1) * 10, page * 10);

  return (
    <section id="markets" className="coins-section">
      <div className="coins-section__inner">
        <div className="coins-header">
          <div>
            <div className="section-eyebrow">Markets</div>
            <h2 className="section-heading">Market Explorer</h2>
            <p className="coins-subtitle">Top 100 by market capitalization</p>
          </div>
          <div className="coins-controls">
            <button
              className={`coins-filter-btn ${watchlistOnly ? 'active' : ''}`}
              onClick={() => { setWatchlistOnly(w => !w); setPage(1); }}
            >★ Watchlist</button>
            <div className="coins-search-wrap">
              <span className="coins-search-icon">⌕</span>
              <input
                className="coins-search"
                type="text"
                placeholder="Search coins..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="coins-error">
            <p>{error}</p>
            <button onClick={fetchCoins}>Retry</button>
          </div>
        ) : (
          <div className="coins-table-wrap">
            <table className="coins-table">
              <thead>
                <tr>
                  {COLUMNS.map(col => (
                    <th
                      key={col}
                      className={`coins-th ${['Price','24H','Market Cap'].includes(col) ? 'sortable' : ''} ${sortKey === col ? 'sorted' : ''}`}
                      onClick={() => ['Price','24H','Market Cap'].includes(col) && handleSort(col)}
                    >
                      {col}
                      {sortKey === col && <span className="sort-arrow">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody ref={tableRef}>
                {loading ? (
                  Array(10).fill(0).map((_, i) => (
                    <tr key={i} className="coins-row-skeleton">
                      {COLUMNS.map(c => <td key={c}><div className="skeleton-cell" /></td>)}
                    </tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="coins-empty">
                      {watchlistOnly ? 'No watchlisted coins found.' : 'No coins match your search.'}
                    </td>
                  </tr>
                ) : paged.map(coin => {
                  const profit = coin.price_change_percentage_24h > 0;
                  const watched = watchlist.includes(coin.id);
                  return (
                    <tr
                      key={coin.id}
                      className="coins-row"
                      onClick={() => history.push(`/coins/${coin.id}`)}
                    >
                      <td className="coins-td coins-td--rank">{coin.market_cap_rank}</td>
                      <td className="coins-td coins-td--asset">
                        <img src={coin.image} alt={coin.name} className="coins-coin-img" />
                        <div className="coins-coin-info">
                          <span className="coins-coin-symbol">{coin.symbol.toUpperCase()}</span>
                          <span className="coins-coin-name">{coin.name}</span>
                        </div>
                      </td>
                      <td className="coins-td coins-td--num">
                        {symbol}{numberWithCommas(coin.current_price.toFixed(2))}
                      </td>
                      <td className="coins-td coins-td--num">
                        <span className={`coins-change ${profit ? 'positive' : 'negative'}`}>
                          {profit ? '+' : ''}{coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) : '0.00'}%
                        </span>
                      </td>
                      <td className="coins-td coins-td--sparkline">
                        {coin.sparkline_in_7d?.price && <Sparkline prices={coin.sparkline_in_7d.price} isPositive={profit} />}
                      </td>
                      <td className="coins-td coins-td--num coins-td--muted">
                        {symbol}{numberWithCommas(coin.market_cap.toString().slice(0,-6))}M
                      </td>
                      <td className="coins-td coins-td--watch">
                        <button
                          className={`watch-btn ${watched ? 'watched' : ''}`}
                          onClick={e => handleWatchlist(e, coin.id)}
                          title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                        >★</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pageCount > 1 && (
          <div className="coins-pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(pageCount, 7) }).map((_, i) => {
              const p = page <= 4 ? i + 1 : page - 3 + i;
              if (p < 1 || p > pageCount) return null;
              return (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <button className="page-btn" disabled={page === pageCount} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CoinsTable;
