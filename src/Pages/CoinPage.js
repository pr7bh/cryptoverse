import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, useHistory } from 'react-router-dom';
import ReactHtmlParser from 'react-html-parser';
import CoinInfo from '../components/CoinInfo/CoinInfo';
import { SingleCoin } from '../config/api';
import { numberWithCommas } from '../utils/format';
import { CryptoState } from '../CryptoContext';
import { toggleWatchlist, isWatchlisted } from '../utils/watchlist';
import gsap from 'gsap';
import './CoinPage.css';

const CoinPage = () => {
  const { id } = useParams();
  const history = useHistory();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watched, setWatched] = useState(isWatchlisted(id));
  const { currency, symbol } = CryptoState();
  const pageRef = useRef(null);

  const fetchCoin = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    axios.get(SingleCoin(id))
      .then(({ data }) => { if (!cancelled) { setCoin(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError('Failed to load coin data.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => { return fetchCoin(); }, [fetchCoin]);

  useEffect(() => {
    if (!loading && coin && pageRef.current) {
      gsap.fromTo('.cp-reveal', { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' });
    }
  }, [loading, coin]);

  const handleWatch = () => {
    const next = toggleWatchlist(id);
    setWatched(next.includes(id));
    gsap.fromTo('.cp-watch-star', { scale: 1 }, { scale: 1.6, duration: 0.2, yoyo: true, repeat: 1, ease: 'back.out(2)' });
  };

  if (loading) return <div className="cp-loading"><div className="cp-spinner" /></div>;
  if (error) return <div className="cp-error"><p>{error}</p><button onClick={fetchCoin}>Retry</button></div>;
  if (!coin) return null;

  const md = coin.market_data || {};
  const curr = currency.toLowerCase();
  const price = md.current_price?.[curr];
  const change24h = md.price_change_percentage_24h;
  const marketCap = md.market_cap?.[curr];
  const volume24h = md.total_volume?.[curr];
  const ath = md.ath?.[curr];
  const atl = md.atl?.[curr];
  const high24h = md.high_24h?.[curr];
  const low24h = md.low_24h?.[curr];
  const isUp = (change24h || 0) >= 0;

  const fmt = (n, dec = 2) => n != null ? numberWithCommas(Number(n).toFixed(dec)) : 'N/A';
  const fmtM = (n) => n != null ? `${symbol}${numberWithCommas(n.toString().slice(0, -6))}M` : 'N/A';

  return (
    <div className="cp-page" ref={pageRef}>

      {/* ── ASSET HEADER ── */}
      <div className="cp-header cp-reveal">
        <div className="cp-header__inner">
          <button className="cp-back" onClick={() => history.push('/')}>← Markets</button>

          <div className="cp-identity">
            <img src={coin.image?.large} alt={coin.name} className="cp-logo" />
            <div>
              <div className="cp-name-row">
                <h1 className="cp-name">{coin.name}</h1>
                <span className="cp-symbol">{coin.symbol?.toUpperCase()}</span>
                <span className="cp-rank">#{coin.market_cap_rank}</span>
              </div>
            </div>
          </div>

          <div className="cp-price-block">
            <div className="cp-price">{symbol}{fmt(price)}</div>
            <div className={`cp-change ${isUp ? 'up' : 'down'}`}>
              <span className="cp-change-arrow">{isUp ? '▲' : '▼'}</span>
              {Math.abs(change24h || 0).toFixed(2)}% 24h
            </div>
          </div>

          <button className={`cp-watch ${watched ? 'active' : ''}`} onClick={handleWatch}>
            <span className="cp-watch-star">★</span>
            {watched ? 'Watching' : 'Watch'}
          </button>
        </div>
      </div>

      {/* ── CHART ── */}
      <div className="cp-chart-section cp-reveal">
        <div className="cp-chart-inner">
          <CoinInfo coin={coin} />
        </div>
      </div>

      {/* ── BOTTOM SPLIT ── */}
      <div className="cp-bottom cp-reveal">
        {/* Market Stats */}
        <div className="cp-stats">
          <div className="cp-stats__title">Market Data</div>
          <div className="cp-stats__grid">
            {[
              { label: 'Market Cap', value: fmtM(marketCap) },
              { label: '24H Volume', value: fmtM(volume24h) },
              { label: '24H High', value: `${symbol}${fmt(high24h)}`, accent: true },
              { label: '24H Low', value: `${symbol}${fmt(low24h)}` },
              { label: 'All-Time High', value: `${symbol}${fmt(ath)}`, accent: true },
              { label: 'All-Time Low', value: `${symbol}${fmt(atl)}` },
            ].map(s => (
              <div key={s.label} className={`cp-stat ${s.accent ? 'accent' : ''}`}>
                <span className="cp-stat__label">{s.label}</span>
                <span className="cp-stat__value">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About + Supply */}
        <div className="cp-about">
          {coin.description?.en && (
            <div className="cp-about__desc">
              <div className="cp-stats__title">About</div>
              <p>{ReactHtmlParser(coin.description.en.split('. ')[0])}.</p>
            </div>
          )}
          <div className="cp-about__supply">
            <div className="cp-stats__title">Supply</div>
            <div className="cp-supply-grid">
              <div className="cp-stat">
                <span className="cp-stat__label">Circulating</span>
                <span className="cp-stat__value">{md.circulating_supply ? numberWithCommas(Math.round(md.circulating_supply).toString()) : 'N/A'}</span>
              </div>
              <div className="cp-stat">
                <span className="cp-stat__label">Maximum</span>
                <span className="cp-stat__value">{md.max_supply ? numberWithCommas(Math.round(md.max_supply).toString()) : '∞'}</span>
              </div>
              <div className="cp-stat accent">
                <span className="cp-stat__label">Total Supply</span>
                <span className="cp-stat__value">{md.total_supply ? numberWithCommas(Math.round(md.total_supply).toString()) : 'N/A'}</span>
              </div>
            </div>
            {md.max_supply && md.circulating_supply && (
              <div className="cp-supply-bar-wrap">
                <div className="cp-supply-bar-label">
                  <span>Circulating supply</span>
                  <span>{((md.circulating_supply / md.max_supply) * 100).toFixed(1)}% of max</span>
                </div>
                <div className="cp-supply-bar-track">
                  <div
                    className="cp-supply-bar-fill"
                    style={{ width: `${Math.min(100, (md.circulating_supply / md.max_supply) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CoinPage;
