import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { CryptoState } from '../CryptoContext';
import { numberWithCommas } from '../utils/format';
import './HeatmapPage.css';

var BASE = process.env.NODE_ENV === 'production' ? '/api/cg' : 'https://api.coingecko.com/api/v3';

function squarify(items, x, y, width, height) {
  if (!items.length) return [];
  var total = items.reduce(function(s, it) { return s + it.value; }, 0);
  if (total === 0 || width <= 0 || height <= 0) return [];
  var results = [];
  var remaining = items.slice();
  var rx = x, ry = y, rw = width, rh = height;
  while (remaining.length > 0) {
    var isHorizontal = rw >= rh;
    var stripDim = isHorizontal ? rh : rw;
    var stripTotal = remaining.reduce(function(s, it) { return s + it.value; }, 0);
    var stripItems = [];
    var stripSum = 0;
    var bestWorstRatio = Infinity;
    for (var i = 0; i < remaining.length; i++) {
      var candidateItems = remaining.slice(0, i + 1);
      var candidateSum = candidateItems.reduce(function(s, it) { return s + it.value; }, 0);
      var stripWidth = (candidateSum / stripTotal) * (isHorizontal ? rw : rh);
      // eslint-disable-next-line no-loop-func
      var worstRatio = candidateItems.reduce(function(worst, it) {
        var tileLen = (it.value / candidateSum) * stripDim;
        var ratio = Math.max(stripWidth / tileLen, tileLen / stripWidth);
        return Math.max(worst, ratio);
      }, 0);
      if (stripItems.length > 0 && worstRatio > bestWorstRatio) break;
      stripItems = candidateItems;
      stripSum = candidateSum;
      bestWorstRatio = worstRatio;
    }
    var stripFraction = stripTotal > 0 ? stripSum / stripTotal : 0;
    var stripMainDim = isHorizontal ? rw * stripFraction : rh * stripFraction;
    var pos = isHorizontal ? ry : rx;
    // eslint-disable-next-line no-loop-func
    stripItems.forEach(function(item) {
      var tileFrac = stripSum > 0 ? item.value / stripSum : 0;
      var tileDim = stripDim * tileFrac;
      var rect = isHorizontal
        ? { x: rx, y: pos, w: stripMainDim, h: tileDim }
        : { x: pos, y: ry, w: tileDim, h: stripMainDim };
      results.push(Object.assign({}, item, { rect: rect }));
      pos += tileDim;
    });
    if (isHorizontal) { rx += stripMainDim; rw -= stripMainDim; }
    else { ry += stripMainDim; rh -= stripMainDim; }
    remaining = remaining.slice(stripItems.length);
  }
  return results;
}

function getTileColor(change) {
  if (change >= 5) return '#00D6A3';
  if (change >= 2) return '#34D399';
  if (change >= 0) return '#6EE7B7';
  if (change >= -2) return '#FCA5A5';
  if (change >= -5) return '#F87171';
  return '#EF4444';
}

var LEGEND = [
  { label: '<-5%', color: '#EF4444' },
  { label: '-2%', color: '#F87171' },
  { label: '0%', color: '#FCA5A5' },
  { label: '+2%', color: '#6EE7B7' },
  { label: '+5%', color: '#34D399' },
  { label: '>+5%', color: '#00D6A3' },
];

var HeatmapPage = function() {
  var cryptoCtx = CryptoState();
  var currency = cryptoCtx.currency;
  var symbol = cryptoCtx.symbol;

  var coinsState = useState([]);
  var coins = coinsState[0];
  var setCoins = coinsState[1];

  var loadState = useState(true);
  var loading = loadState[0];
  var setLoading = loadState[1];

  var ttState = useState(null);
  var tooltip = ttState[0];
  var setTooltip = ttState[1];

  var tpState = useState({ x: 0, y: 0 });
  var tooltipPos = tpState[0];
  var setTooltipPos = tpState[1];

  var containerRef = useRef(null);

  var csState = useState({ w: 0, h: 0 });
  var containerSize = csState[0];
  var setContainerSize = csState[1];

  var errState = useState(false);
  var hasError = errState[0];
  var setHasError = errState[1];

  var retryState = useState(0);
  var retryCount = retryState[0];
  var setRetryCount = retryState[1];

  // ResizeObserver: runs once — container is always in DOM so ref is available
  useEffect(function() {
    if (!containerRef.current) return;
    var ro = new ResizeObserver(function(entries) {
      var entry = entries[0];
      if (entry) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(containerRef.current);
    return function() { ro.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(function() {
    setLoading(true);
    setHasError(false);
    axios.get(BASE + '/coins/markets?vs_currency=' + currency.toLowerCase() + '&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h')
      .then(function(res) { setCoins(res.data || []); setLoading(false); })
      .catch(function() { setLoading(false); setHasError(true); });
  }, [currency, retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  var items = coins
    .filter(function(c) { return c.market_cap > 0; })
    .map(function(c) {
      return {
        id: c.id,
        symbol: (c.symbol || '').toUpperCase(),
        name: c.name,
        image: c.image,
        price: c.current_price,
        change: c.price_change_percentage_24h || 0,
        marketCap: c.market_cap,
        value: c.market_cap,
      };
    });

  var tiles = containerSize.w > 0 && containerSize.h > 0
    ? squarify(items, 0, 0, containerSize.w, containerSize.h)
    : [];

  var GAP = 2;

  return (
    <div className="hm-page">
      <div className="hm-header">
        <div className="hm-header__inner">
          <div>
            <div className="hm-eyebrow">Market Heatmap</div>
            <h1 className="hm-title">Top 100 by Market Cap</h1>
          </div>
          <div className="hm-legend">
            {LEGEND.map(function(l) {
              return (
                <div key={l.label} className="hm-legend-item">
                  <span className="hm-legend-dot" style={{ background: l.color }} />
                  <span className="hm-legend-lbl">{l.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hm-wrap">
        <div className="hm-container" ref={containerRef}>
          {loading && (
            <div className="hm-overlay">
              <div className="hm-skeleton-grid">
                {Array.from({ length: 20 }).map(function(_, i) {
                  return <div key={i} className="hm-skeleton-tile" style={{ animationDelay: (i * 0.05) + 's' }} />;
                })}
              </div>
            </div>
          )}
          {hasError && !loading && (
            <div className="hm-error-state">
              <div className="hm-error-icon">⚠</div>
              <div className="hm-error-title">Rate Limited</div>
              <p className="hm-error-msg">CoinGecko rate limit reached. Please wait a moment.</p>
              <button className="hm-retry-btn" onClick={function() { setRetryCount(function(n) { return n + 1; }); }}>Retry</button>
            </div>
          )}
          {!loading && !hasError && tiles.map(function(tile) {
              var r = tile.rect;
              var tooSmall = r.w < 50 || r.h < 40;
              var verySmall = r.w < 70 || r.h < 55;
              return (
                <div
                  key={tile.id}
                  className="hm-tile"
                  style={{
                    left: r.x + GAP / 2,
                    top: r.y + GAP / 2,
                    width: Math.max(0, r.w - GAP),
                    height: Math.max(0, r.h - GAP),
                    background: getTileColor(tile.change),
                    color: tile.change < 0 ? '#fff' : '#07090D',
                  }}
                  onMouseEnter={function(e) {
                    setTooltip(tile);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={function(e) { setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                  onMouseLeave={function() { setTooltip(null); }}
                >
                  {!tooSmall && (
                    <React.Fragment>
                      <span className="hm-tile-sym">{tile.symbol}</span>
                      {!verySmall && (
                        <span className="hm-tile-chg">{tile.change >= 0 ? '+' : ''}{tile.change.toFixed(2)}%</span>
                      )}
                    </React.Fragment>
                  )}
                </div>
              );
          })}
        </div>
      </div>

      {tooltip && (
        <div className="hm-tooltip" style={{ left: tooltipPos.x + 16, top: tooltipPos.y - 10 }}>
          <div className="hm-tt-header">
            {tooltip.image && <img src={tooltip.image} alt={tooltip.name} className="hm-tt-img" />}
            <div>
              <div className="hm-tt-name">{tooltip.name}</div>
              <div className="hm-tt-sym">{tooltip.symbol}</div>
            </div>
          </div>
          <div className="hm-tt-row">
            <span>Price</span>
            <span>{symbol}{numberWithCommas(Number(tooltip.price || 0).toFixed(tooltip.price < 1 ? 6 : 2))}</span>
          </div>
          <div className="hm-tt-row">
            <span>24h Change</span>
            <span style={{ color: tooltip.change >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
              {tooltip.change >= 0 ? '+' : ''}{tooltip.change.toFixed(2)}%
            </span>
          </div>
          <div className="hm-tt-row">
            <span>Market Cap</span>
            <span>{symbol}{numberWithCommas((tooltip.marketCap / 1e9).toFixed(2))}B</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapPage;
