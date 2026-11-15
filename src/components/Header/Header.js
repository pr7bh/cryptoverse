import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { CryptoState } from '../../CryptoContext';
import { useTheme } from '../../theme/ThemeContext';
import gsap from 'gsap';
import './Header.css';

const Header = () => {
  const { currency, setCurrency } = CryptoState();
  const history = useHistory();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const { preference, setPreference } = useTheme();

  const cycleTheme = () => {
    const next = preference === 'dark' ? 'light' : preference === 'light' ? 'system' : 'dark';
    setPreference(next);
  };
  const themeIcon = preference === 'dark' ? '☾' : preference === 'light' ? '☀' : '⊙';
  const themeLabel = preference === 'dark' ? 'Dark' : preference === 'light' ? 'Light' : 'Auto';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  const handleCurrencyChange = (curr) => {
    if (curr !== currency) setCurrency(curr);
  };

  const isHome = location.pathname === '/';

  return (
    <header ref={headerRef} className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__inner">
        <div className="header__logo" onClick={() => history.push('/')}>
          <span className="header__logo-mark">◈</span>
          <span className="header__logo-text">Cryptoverse</span>
        </div>

        <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          <a href="/" className={`header__nav-link ${isHome ? 'active' : ''}`}>Markets</a>
          <a href="#trending" className="header__nav-link">Trending</a>
          <div className="header__currency">
            {['USD', 'INR'].map(c => (
              <button
                key={c}
                className={`header__currency-btn ${currency === c ? 'active' : ''}`}
                onClick={() => handleCurrencyChange(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <button className="header__theme-btn" onClick={cycleTheme} title={`Theme: ${themeLabel}`}>
            <span className="header__theme-icon">{themeIcon}</span>
            <span className="header__theme-label">{themeLabel}</span>
          </button>
        </nav>

        <button
          className={`header__hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
};

export default Header;
