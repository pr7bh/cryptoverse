import React from 'react';
import { useHistory } from 'react-router-dom';
import './Footer.css';

const NAV = [
  { label: 'Markets', href: '/#markets' },
  { label: 'Trending', href: '/#trending' },
];

const SOCIALS = [
  {
    label: 'GitHub',
    href: 'https://github.com/pr7bh/cryptoverse',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
  },
  {
    label: 'CoinGecko',
    href: 'https://www.coingecko.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 12a4 4 0 008 0"/>
        <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
];

const Footer = () => {
  const history = useHistory();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* Brand */}
        <div className="footer__brand">
          <div className="footer__logo" onClick={() => history.push('/')}>
            <span className="footer__logo-mark">◈</span>
            <span className="footer__logo-text">Cryptoverse</span>
          </div>
          <p className="footer__tagline">
            Real-time digital asset intelligence.<br />
            Powered by CoinGecko.
          </p>
          <div className="footer__socials">
            {SOCIALS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-btn"
                title={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Nav */}
        <div className="footer__col">
          <div className="footer__col-title">Explore</div>
          <ul className="footer__links">
            {NAV.map(n => (
              <li key={n.label}>
                <a href={n.href} className="footer__link">{n.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Data */}
        <div className="footer__col">
          <div className="footer__col-title">Data</div>
          <ul className="footer__links">
            <li><a href="https://www.coingecko.com/en/api" target="_blank" rel="noopener noreferrer" className="footer__link">CoinGecko API</a></li>
            <li><a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="footer__link">Market Data</a></li>
          </ul>
        </div>

        {/* Status pill */}
        <div className="footer__col footer__col--status">
          <div className="footer__col-title">Status</div>
          <div className="footer__status">
            <span className="footer__status-dot" />
            Live market data
          </div>
          <p className="footer__status-note">Prices update every 60s via CoinGecko public API.</p>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <span className="footer__copy">© {year} Cryptoverse. For informational purposes only.</span>
          <span className="footer__disclaimer">Not financial advice. Data provided by CoinGecko.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
