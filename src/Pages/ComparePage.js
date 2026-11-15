import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { CryptoState } from '../CryptoContext';
import { useTheme } from '../theme/ThemeContext';
import { numberWithCommas } from '../utils/format';
import './ComparePage.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

var BASE = process.env.NODE_ENV === 'production' ? '/api/cg' : 'https://api.coingecko.com/api/v3';
var COIN_COLORS = ['#B9F36B', '#9B8CFF', '#00D6A3', '#FF5570'];
var PERIODS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

function fmtMkt(n) {
  if (!n) return '—';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  return (n / 1e6).toFixed(2) + 'M';
}

var ComparePage = function() {
  var cryptoCtx = CryptoState();
  var currency = cryptoCtx.currency;
  var symbol = cryptoCtx.symbol;
  var themeCtx = useTheme();
  var theme = themeCtx.theme;
  var isDark = theme === 'dark';

  var selCoinsState = useState([]);
  var selectedCoins = selCoinsState[0];
  var setSelectedCoins = selCoinsState[1];

  var searchState = useState('');
  var coinSearch = searchState[0];
  var setCoinSearch = searchState[1];

  var sugState = useState([]);
  var suggestions = sugState[0];
  var setSuggestions = sugState[1];

  var periodState = useState(PERIODS[2]);
  var period = periodState[0];
  var setPeriod = periodState[1];

  var chartDataState = useState({});
  var chartData = chartDataState[0];
  var setChartData = chartDataState[1];

  var detailsState = useState({});
  var coinDetails = detailsState[0];
  var setCoinDetails = detailsState[1];

  var searchTimerRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(function() {
    clearTimeout(searchTimerRef.current);
    if (!coinSearch || coinSearch.length < 2) { setSuggestions([]); return; }
    searchTimerRef.current = setTimeout(function() {
      axios.get(BASE + '/search?query=' + encodeURIComponent(coinSearch))
        .then(function(res) { setSuggestions((res.data.coins || []).slice(0, 6)); })
        .catch(function() {});
    }, 300);
  }, [coinSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  var addCoin = function(coin) {
    if (selectedCoins.find(function(c) { return c.id === coin.id; }) || selectedCoins.length >= 4) return;
    setCoinSearch('');
    setSuggestions([]);
    setSelectedCoins(function(prev) {
      return prev.concat([{
        id: coin.id,
        name: coin.name,
        symbol: (coin.symbol || '').toUpperCase(),
        image: coin.large || coin.thumb || '',
      }]);
    });
  };

  var removeCoin = function(id) {
    setSelectedCoins(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
  };

  var selectedIds = selectedCoins.map(function(c) { return c.id; }).join(',');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(function() {
    if (!selectedCoins.length) return;
    var curr = currency.toLowerCase();
    selectedCoins.forEach(function(coin) {
      axios.get(BASE + '/coins/' + coin.id + '/market_chart?vs_currency=' + curr + '&days=' + period.days)
        .then(function(res) {
          setChartData(function(prev) {
            var next = Object.assign({}, prev);
            next[coin.id] = res.data.prices || [];
            return next;
          });
        })
        .catch(function() {});
    });
  }, [selectedIds, period, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(function() {
    if (!selectedCoins.length) return;
    selectedCoins.forEach(function(coin) {
      if (coinDetails[coin.id]) return;
      axios.get(BASE + '/coins/markets?vs_currency=' + currency.toLowerCase() + '&ids=' + coin.id + '&sparkline=false&price_change_percentage=24h,7d')
        .then(function(res) {
          if (res.data && res.data[0]) {
            setCoinDetails(function(prev) {
              var next = Object.assign({}, prev);
              next[coin.id] = res.data[0];
              return next;
            });
          }
        })
        .catch(function() {});
    });
  }, [selectedIds, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  var buildDataset = function() {
    if (!selectedCoins.length) return { labels: [], datasets: [] };
    var firstId = selectedCoins[0].id;
    var firstPrices = chartData[firstId] || [];
    var labels = firstPrices.map(function(p) {
      var d = new Date(p[0]);
      if (period.days === 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    });
    var datasets = selectedCoins.map(function(coin, i) {
      var priceArr = chartData[coin.id] || [];
      var startPrice = priceArr.length > 0 ? priceArr[0][1] : 1;
      var data = priceArr.map(function(p) {
        return startPrice > 0 ? ((p[1] - startPrice) / startPrice) * 100 : 0;
      });
      var color = COIN_COLORS[i];
      return {
        label: coin.symbol,
        data: data,
        borderColor: color,
        backgroundColor: color + '15',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      };
    });
    return { labels: labels, datasets: datasets };
  };

  var chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: isDark ? '#8993A4' : '#64748B', font: { size: 12 }, boxWidth: 24, padding: 16 },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(13,17,24,0.97)' : 'rgba(255,255,255,0.98)',
        titleColor: isDark ? '#8993A4' : '#64748B',
        bodyColor: isDark ? '#F5F7FA' : '#111827',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
        borderWidth: 1,
        callbacks: {
          label: function(ctx) {
            return ' ' + ctx.dataset.label + ': ' + (ctx.parsed.y >= 0 ? '+' : '') + ctx.parsed.y.toFixed(2) + '%';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
        ticks: { color: isDark ? '#8993A4' : '#64748B', font: { size: 11 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
        ticks: {
          color: isDark ? '#8993A4' : '#64748B',
          font: { size: 11 },
          callback: function(v) { return (v >= 0 ? '+' : '') + v.toFixed(1) + '%'; },
        },
      },
    },
  };

  var dataset = buildDataset();

  return (
    <div className="cmp-page">
      <div className="cmp-header">
        <div className="cmp-header__inner">
          <div>
            <div className="cmp-eyebrow">Compare</div>
            <h1 className="cmp-title">Coin Comparison</h1>
            <p className="cmp-sub">Select up to 4 cryptocurrencies to compare performance.</p>
          </div>
        </div>
      </div>

      <div className="cmp-body">
        <div className="cmp-add-section">
          <div className="cmp-search-wrap">
            <input
              className="cmp-search"
              type="text"
              placeholder={selectedCoins.length >= 4 ? 'Maximum 4 coins selected' : 'Add a coin to compare...'}
              value={coinSearch}
              onChange={function(e) { setCoinSearch(e.target.value); }}
              disabled={selectedCoins.length >= 4}
            />
            {suggestions.length > 0 && (
              <div className="cmp-suggestions">
                {suggestions.map(function(c) {
                  return (
                    <button key={c.id} className="cmp-suggestion" onClick={function() { addCoin(c); }}>
                      {c.thumb && <img src={c.thumb} alt={c.name} className="cmp-sug-img" />}
                      <span className="cmp-sug-name">{c.name}</span>
                      <span className="cmp-sug-sym">{(c.symbol || '').toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="cmp-chips">
            {selectedCoins.map(function(coin, i) {
              return (
                <div key={coin.id} className="cmp-chip" style={{ '--chip-color': COIN_COLORS[i] }}>
                  {coin.image && <img src={coin.image} alt={coin.name} className="cmp-chip-img" />}
                  <span className="cmp-chip-sym">{coin.symbol}</span>
                  <button className="cmp-chip-rm" onClick={function() { removeCoin(coin.id); }}>✕</button>
                </div>
              );
            })}
            {selectedCoins.length === 0 && (
              <div className="cmp-hint">Search above to add coins for comparison.</div>
            )}
          </div>
        </div>

        {selectedCoins.length > 0 && (
          <React.Fragment>
            <div className="cmp-period-row">
              {PERIODS.map(function(p) {
                return (
                  <button
                    key={p.label}
                    className={'cmp-period-btn' + (period.label === p.label ? ' active' : '')}
                    onClick={function() { setPeriod(p); }}
                  >{p.label}</button>
                );
              })}
            </div>

            <div className="cmp-chart-card">
              <div className="cmp-chart-title">Performance (% change, normalized)</div>
              <div className="cmp-chart-wrap">
                {dataset.labels.length > 0 ? (
                  <Line data={dataset} options={chartOptions} />
                ) : (
                  <div className="cmp-chart-loading">Loading chart data...</div>
                )}
              </div>
            </div>

            <div className="cmp-cards" style={{ gridTemplateColumns: 'repeat(' + selectedCoins.length + ', 1fr)' }}>
              {selectedCoins.map(function(coin, i) {
                var details = coinDetails[coin.id];
                var color = COIN_COLORS[i];
                var change24h = details && details.price_change_percentage_24h;
                var change7d = details && details.price_change_percentage_7d_in_currency;
                return (
                  <div key={coin.id} className="cmp-card" style={{ '--card-accent': color }}>
                    <div className="cmp-card-header">
                      {coin.image && <img src={coin.image} alt={coin.name} className="cmp-card-img" />}
                      <div>
                        <div className="cmp-card-sym">{coin.symbol}</div>
                        <div className="cmp-card-name">{coin.name}</div>
                      </div>
                      <div className="cmp-card-dot" style={{ background: color }} />
                    </div>
                    <div className="cmp-card-price">
                      {details ? symbol + numberWithCommas(Number(details.current_price || 0).toFixed(2)) : '—'}
                    </div>
                    <div className="cmp-card-stats">
                      <div className="cmp-stat">
                        <span className="cmp-stat-label">24h</span>
                        <span className={'cmp-stat-val' + (change24h >= 0 ? ' cmp-pos' : ' cmp-neg')}>
                          {change24h != null ? (change24h >= 0 ? '+' : '') + change24h.toFixed(2) + '%' : '—'}
                        </span>
                      </div>
                      <div className="cmp-stat">
                        <span className="cmp-stat-label">7d</span>
                        <span className={'cmp-stat-val' + (change7d >= 0 ? ' cmp-pos' : ' cmp-neg')}>
                          {change7d != null ? (change7d >= 0 ? '+' : '') + change7d.toFixed(2) + '%' : '—'}
                        </span>
                      </div>
                      <div className="cmp-stat">
                        <span className="cmp-stat-label">Market Cap</span>
                        <span className="cmp-stat-val">{details ? symbol + fmtMkt(details.market_cap) : '—'}</span>
                      </div>
                      <div className="cmp-stat">
                        <span className="cmp-stat-label">Volume</span>
                        <span className="cmp-stat-val">{details ? symbol + fmtMkt(details.total_volume) : '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
