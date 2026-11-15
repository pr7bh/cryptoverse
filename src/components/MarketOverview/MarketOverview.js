import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './MarketOverview.css';
gsap.registerPlugin(ScrollTrigger);

const fmt = (n) => {
  if (!n) return 'N/A';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  return `$${(n / 1e6).toFixed(2)}M`;
};

const MarketOverview = () => {
  const [data, setData] = useState(null);
  const [barReady, setBarReady] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    axios.get('https://api.coingecko.com/api/v3/global')
      .then(({ data: d }) => { if (!cancelled) setData(d.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => setBarReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [data]);

  useEffect(() => {
    if (!data || !sectionRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.mo-primary',
        { opacity: 0, x: -40 },
        {
          opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
        }
      );
      gsap.fromTo('.mo-secondary-item',
        { opacity: 0, x: 30 },
        {
          opacity: 1, x: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [data]);

  const capChange = data?.market_cap_change_percentage_24h_usd;
  const isUp = (capChange || 0) >= 0;
  const btcDom = data?.market_cap_percentage?.btc?.toFixed(1);
  const ethDom = data?.market_cap_percentage?.eth?.toFixed(1);

  return (
    <section className="mo-section" ref={sectionRef}>
      <div className="mo-inner">
        <div className="mo-eyebrow">Market Intelligence</div>
        <div className="mo-layout">

          {/* Primary — Total Market Cap */}
          <div className="mo-primary">
            <div className="mo-primary__label">Total Market Cap</div>
            <div className="mo-primary__value">
              {data ? fmt(data.total_market_cap?.usd) : <span className="mo-skeleton mo-skeleton--lg" />}
            </div>
            {data && capChange != null && (
              <div className={`mo-primary__change ${isUp ? 'pos' : 'neg'}`}>
                <span>{isUp ? '▲' : '▼'}</span>
                {Math.abs(capChange).toFixed(2)}% past 24h
              </div>
            )}
            {data && (
              <div className="mo-primary__bar-wrap">
                <div className="mo-primary__bar" style={{ width: barReady ? `${Math.min(100, Math.abs(capChange || 0) * 10)}%` : '0%' }} />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mo-divider" />

          {/* Secondary — 3-item list */}
          <div className="mo-secondary">
            <div className="mo-secondary-item">
              <div className="mo-si-labels">
                <span className="mo-si-label">BTC Dominance</span>
                {data && ethDom && <span className="mo-si-sub">ETH {ethDom}%</span>}
                {data && btcDom && (
                  <div className="mo-btc-bar-wrap">
                    <div className="mo-btc-bar" style={{ width: barReady ? `${btcDom}%` : '0%' }} />
                  </div>
                )}
              </div>
              <div className="mo-si-value">{data ? `${btcDom}%` : <span className="mo-skeleton" />}</div>
            </div>
            <div className="mo-secondary-item">
              <div className="mo-si-labels">
                <span className="mo-si-label">24H Volume</span>
              </div>
              <div className="mo-si-value">{data ? fmt(data.total_volume?.usd) : <span className="mo-skeleton" />}</div>
            </div>
            <div className="mo-secondary-item">
              <div className="mo-si-labels">
                <span className="mo-si-label">Active Assets</span>
                {data && <span className="mo-si-sub">{data.markets?.toLocaleString()} exchanges</span>}
              </div>
              <div className="mo-si-value">{data ? data.active_cryptocurrencies?.toLocaleString() : <span className="mo-skeleton" />}</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MarketOverview;
