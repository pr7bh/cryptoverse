import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AliceCarousel from 'react-alice-carousel';
import 'react-alice-carousel/lib/alice-carousel.css';
import { TrendingCoins as API } from '../../config/api';
import { CryptoState } from '../../CryptoContext';
import { numberWithCommas } from '../../utils/format';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './TrendingCoins.css';
gsap.registerPlugin(ScrollTrigger);

const TrendingCard = ({ coin, symbol }) => {
  const cardRef = useRef(null);
  const up = coin.price_change_percentage_24h >= 0;

  const onMouseMove = useCallback((e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mx', `${x}%`);
    cardRef.current.style.setProperty('--my', `${y}%`);
  }, []);

  const onMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--mx', '50%');
    cardRef.current.style.setProperty('--my', '50%');
  }, []);

  return (
    <Link
      to={`/coins/${coin.id}`}
      className="tc-card"
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className="tc-card__spotlight" />
      <div className="tc-rank">#{coin.market_cap_rank}</div>
      <div className="tc-img-wrap">
        <img src={coin.image} alt={coin.name} className="tc-img" />
      </div>
      <div className="tc-symbol">{coin.symbol.toUpperCase()}</div>
      <div className="tc-name">{coin.name}</div>
      <div className="tc-price">{symbol}{numberWithCommas(coin.current_price.toFixed(2))}</div>
      <div className={`tc-change ${up ? 'up' : 'down'}`}>
        {up ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
      </div>
    </Link>
  );
};

const TrendingCoins = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currency, symbol } = CryptoState();
  const sectionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get(API(currency))
      .then(({ data }) => { if (!cancelled) { setCoins(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currency]);

  useEffect(() => {
    if (!loading && sectionRef.current && coins.length) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const ctx = gsap.context(() => {
        gsap.fromTo('.tc-card',
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out',
            scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
          }
        );
      }, sectionRef);
      return () => ctx.revert();
    }
  }, [loading, coins]);

  const responsive = { 0: { items: 2 }, 480: { items: 3 }, 768: { items: 4 }, 1200: { items: 5 } };

  const items = coins.map(coin => (
    <TrendingCard key={coin.id} coin={coin} symbol={symbol} />
  ));

  return (
    <section id="trending" className="tc-section" ref={sectionRef}>
      <div className="tc-inner">
        <div className="tc-header">
          <div className="section-eyebrow">Trending</div>
          <h2 className="section-heading">Top Performers</h2>
        </div>
        {loading ? (
          <div className="tc-skeleton-row">
            {Array(5).fill(0).map((_, i) => <div key={i} className="tc-skeleton" />)}
          </div>
        ) : (
          <AliceCarousel
            mouseTracking
            infinite
            autoPlay
            autoPlayInterval={2500}
            animationDuration={800}
            disableDotsControls
            disableButtonsControls
            responsive={responsive}
            items={items}
          />
        )}
      </div>
    </section>
  );
};

export default TrendingCoins;
