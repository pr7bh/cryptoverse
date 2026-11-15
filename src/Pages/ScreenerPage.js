import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { CryptoState } from '../CryptoContext';
import { numberWithCommas } from '../utils/format';
import './ScreenerPage.css';

var BASE = process.env.NODE_ENV === 'production' ? '/api/cg' : 'https://api.coingecko.com/api/v3';

function fmtMkt(n) {
  if (!n) return '—';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  return numberWithCommas(n.toFixed(0));
}

function fmtPct(n) {
  if (n == null) return '—';
  return (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';
}

var MCAP_FILTERS = [
  { label: 'All', test: function() { return true; } },
  { label: 'Large (>$10B)', test: function(c) { return c.market_cap >= 10e9; } },
  { label: 'Mid ($1B–$10B)', test: function(c) { return c.market_cap >= 1e9 && c.market_cap < 10e9; } },
  { label: 'Small (<$1B)', test: function(c) { return c.market_cap < 1e9; } },
];

var CHANGE_FILTERS = [
  { label: 'All', test: function() { return true; } },
  { label: 'Gainers', test: function(c) { return (c.price_change_percentage_24h || 0) > 0; } },
  { label: 'Losers', test: function(c) { return (c.price_change_percentage_24h || 0) < 0; } },
  { label: 'Big Gainers (>5%)', test: function(c) { return (c.price_change_percentage_24h || 0) > 5; } },
  { label: 'Big Losers (<-5%)', test: function(c) { return (c.price_change_percentage_24h || 0) < -5; } },
];

var COLS = [
  { key: 'market_cap_rank', label: '#', align: 'left' },
  { key: 'name', label: 'Asset', align: 'left' },
  { key: 'current_price', label: 'Price', align: 'right' },
  { key: 'price_change_percentage_24h', label: '24h %', align: 'right' },
  { key: 'price_change_percentage_7d_in_currency', label: '7d %', align: 'right' },
  { key: 'market_cap', label: 'Mkt Cap', align: 'right' },
  { key: 'total_volume', label: 'Volume', align: 'right' },
  { key: '_supplyRatio', label: 'Supply %', align: 'right' },
];

var ScreenerPage = function() {
  var cryptoCtx = CryptoState();
  var currency = cryptoCtx.currency;
  var symbol = cryptoCtx.symbol;
  var history = useHistory();

  var coinsState = useState([]);
  var coins = coinsState[0];
  var setCoins = coinsState[1];

  var loadState = useState(true);
  var loading = loadState[0];
  var setLoading = loadState[1];

  var sortKeyState = useState('market_cap');
  var sortKey = sortKeyState[0];
  var setSortKey = sortKeyState[1];

  var sortDirState = useState('desc');
  var sortDir = sortDirState[0];
  var setSortDir = sortDirState[1];

  var mcapState = useState(0);
  var mcapFilter = mcapState[0];
  var setMcapFilter = mcapState[1];

  var changeState = useState(0);
  var changeFilter = changeState[0];
  var setChangeFilter = changeState[1];

  var searchState = useState('');
  var search = searchState[0];
  var setSearch = searchState[1];

  useEffect(function() {
    setLoading(true);
    axios.get(BASE + '/coins/markets?vs_currency=' + currency.toLowerCase() + '&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d')
      .then(function(res) { setCoins(res.data || []); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, [currency]);

  var handleSort = function(key) {
    if (sortKey === key) {
      setSortDir(function(d) { return d === 'asc' ? 'desc' : 'asc'; });
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  var enriched = useMemo(function() {
    return coins.map(function(c) {
      return Object.assign({}, c, {
        _supplyRatio: c.total_supply > 0 ? (c.circulating_supply / c.total_supply) * 100 : null,
      });
    });
  }, [coins]);

  var filtered = useMemo(function() {
    var mcapTest = MCAP_FILTERS[mcapFilter].test;
    var changeTest = CHANGE_FILTERS[changeFilter].test;
    return enriched
      .filter(function(c) { return mcapTest(c); })
      .filter(function(c) { return changeTest(c); })
      .filter(function(c) {
        return !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.symbol || '').toLowerCase().includes(search.toLowerCase());
      })
      .sort(function(a, b) {
        var av = a[sortKey] == null ? (sortDir === 'desc' ? -Infinity : Infinity) : a[sortKey];
        var bv = b[sortKey] == null ? (sortDir === 'desc' ? -Infinity : Infinity) : b[sortKey];
        if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        return sortDir === 'asc' ? av - bv : bv - av;
      });
  }, [enriched, mcapFilter, changeFilter, search, sortKey, sortDir]);

  var renderCell = function(coin, col) {
    switch (col.key) {
      case 'market_cap_rank':
        return <span className="sc-rank">{coin.market_cap_rank}</span>;
      case 'name':
        return (
          <div className="sc-asset">
            <img src={coin.image} alt={coin.name} className="sc-img" />
            <div>
              <div className="sc-name">{coin.name}</div>
              <div className="sc-sym">{(coin.symbol || '').toUpperCase()}</div>
            </div>
          </div>
        );
      case 'current_price':
        return <span>{symbol}{numberWithCommas(Number(coin.current_price || 0).toFixed(coin.current_price < 1 ? 4 : 2))}</span>;
      case 'price_change_percentage_24h': {
        var v24 = coin.price_change_percentage_24h;
        return <span className={v24 >= 0 ? 'sc-pos' : 'sc-neg'}>{fmtPct(v24)}</span>;
      }
      case 'price_change_percentage_7d_in_currency': {
        var v7 = coin.price_change_percentage_7d_in_currency;
        return <span className={v7 >= 0 ? 'sc-pos' : 'sc-neg'}>{fmtPct(v7)}</span>;
      }
      case 'market_cap':
        return <span>{symbol}{fmtMkt(coin.market_cap)}</span>;
      case 'total_volume':
        return <span>{symbol}{fmtMkt(coin.total_volume)}</span>;
      case '_supplyRatio':
        return coin._supplyRatio != null
          ? (
            <div className="sc-supply-wrap">
              <div className="sc-supply-bar"><div className="sc-supply-fill" style={{ width: Math.min(100, coin._supplyRatio) + '%' }} /></div>
              <span>{coin._supplyRatio.toFixed(0)}%</span>
            </div>
          )
          : <span className="sc-muted">—</span>;
      default:
        return null;
    }
  };

  return (
    <div className="sc-page">
      <div className="sc-header">
        <div className="sc-header__inner">
          <div>
            <div className="sc-eyebrow">Screener</div>
            <h1 className="sc-title">Market Screener</h1>
          </div>
          <div className="sc-controls">
            <input
              className="sc-search"
              type="text"
              placeholder="Search coins..."
              value={search}
              onChange={function(e) { setSearch(e.target.value); }}
            />
          </div>
        </div>
        <div className="sc-filters">
          <div className="sc-filter-group">
            <span className="sc-filter-label">Market Cap</span>
            {MCAP_FILTERS.map(function(f, i) {
              return (
                <button
                  key={f.label}
                  className={'sc-filter-btn' + (mcapFilter === i ? ' active' : '')}
                  onClick={function() { setMcapFilter(i); }}
                >{f.label}</button>
              );
            })}
          </div>
          <div className="sc-filter-group">
            <span className="sc-filter-label">24h Change</span>
            {CHANGE_FILTERS.map(function(f, i) {
              return (
                <button
                  key={f.label}
                  className={'sc-filter-btn' + (changeFilter === i ? ' active' : '')}
                  onClick={function() { setChangeFilter(i); }}
                >{f.label}</button>
              );
            })}
          </div>
        </div>
        <div className="sc-count">{filtered.length} coins matching filters</div>
      </div>

      <div className="sc-body">
        {loading ? (
          <div className="sc-loading">
            {Array.from({ length: 15 }).map(function(_, i) {
              return <div key={i} className="sc-skeleton-row" style={{ animationDelay: (i * 0.03) + 's' }} />;
            })}
          </div>
        ) : (
          <div className="sc-table-wrap">
            <table className="sc-table">
              <thead>
                <tr>
                  {COLS.map(function(col) {
                    return (
                      <th
                        key={col.key}
                        className={'sc-th sc-th--' + col.align}
                        onClick={function() { handleSort(col.key); }}
                      >
                        <span className="sc-th-inner">
                          {col.label}
                          <span className="sc-sort-icon">{sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map(function(coin) {
                  return (
                    <tr key={coin.id} className="sc-row" onClick={function() { history.push('/coins/' + coin.id); }}>
                      {COLS.map(function(col) {
                        return (
                          <td key={col.key} className={'sc-td sc-td--' + col.align}>{renderCell(coin, col)}</td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenerPage;
