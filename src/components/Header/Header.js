import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useHistory, useLocation } from 'react-router-dom';
import { CryptoState } from '../../CryptoContext';
import { useTheme } from '../../theme/ThemeContext';
import gsap from 'gsap';
import './Header.css';

const NAV_LINKS = [
  { label: 'Markets', path: '/' },
  { label: 'Heatmap', path: '/heatmap' },
  { label: 'Compare', path: '/compare' },
  { label: 'Screener', path: '/screener' },
  { label: 'Converter', path: '/converter' },
  { label: 'Portfolio', path: '/portfolio' },
];

const Header = () => {
  const { currency, setCurrency } = CryptoState();
  const history = useHistory();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const navRef = useRef(null);
  const { preference, setPreference } = useTheme();

  const cycleTheme = () => {
    const next = preference === 'dark' ? 'light' : preference === 'light' ? 'system' : 'dark';
    setPreference(next);
  };
  const themeIcon = preference === 'dark' ? '☾' : preference === 'light' ? '☀' : '⊙';
  const themeLabel = preference === 'dark' ? 'Dark' : preference === 'light' ? 'Light' : 'Auto';

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Header entrance
  useEffect(() => {
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  // Close on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Escape key + resize
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    const onResize = () => { if (window.innerWidth > 1024) setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Full-screen menu animation + scroll lock
  useEffect(() => {
    if (!navRef.current) return;
    const links = navRef.current.querySelectorAll('.header__menu-link');
    const foot = navRef.current.querySelectorAll('.header__menu-foot > *');

    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      gsap.fromTo(links,
        { opacity: 0, y: 40, skewY: 4 },
        { opacity: 1, y: 0, skewY: 0, stagger: 0.07, duration: 0.6, ease: 'power3.out', delay: 0.15 }
      );
      gsap.fromTo(foot,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.45, ease: 'power2.out', delay: 0.6 }
      );
    } else {
      document.body.style.overflow = '';
      gsap.set(links, { opacity: 0, y: 40, skewY: 4 });
      gsap.set(foot, { opacity: 0, y: 16 });
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleCurrencyChange = (curr) => {
    if (curr !== currency) setCurrency(curr);
  };

  const navigate = (path) => {
    history.push(path);
    setMenuOpen(false);
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname === path;

  return (
    <React.Fragment>
    <header ref={headerRef} className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__inner">
        <div className="header__logo" onClick={() => navigate('/')}>
          <span className="header__logo-mark">◈</span>
          <span className="header__logo-text">Cryptoverse</span>
        </div>

        {/* Desktop nav */}
        <nav className="header__nav header__nav--desktop">
          {NAV_LINKS.map(l => (
            <a
              key={l.path}
              href={l.path}
              className={`header__nav-link ${l.path !== '/' ? 'header__nav-link--small' : ''} ${isActive(l.path) ? 'active' : ''}`}
              onClick={e => { e.preventDefault(); navigate(l.path); }}
            >
              {l.label}
            </a>
          ))}
          <div className="header__currency">
            {['USD', 'INR'].map(c => (
              <button key={c} className={`header__currency-btn ${currency === c ? 'active' : ''}`} onClick={() => handleCurrencyChange(c)}>{c}</button>
            ))}
          </div>
          <button className="header__theme-btn" onClick={cycleTheme} title={`Theme: ${themeLabel}`}>
            <span className="header__theme-icon">{themeIcon}</span>
            <span className="header__theme-label">{themeLabel}</span>
          </button>
        </nav>

        {/* Hamburger */}
        <button
          className={`header__hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

    </header>
    {ReactDOM.createPortal(
      <div ref={navRef} className={`header__menu ${menuOpen ? 'header__menu--open' : ''}`} aria-hidden={!menuOpen}>
        <nav className="header__menu-nav">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.path}
              href={l.path}
              className={`header__menu-link ${isActive(l.path) ? 'active' : ''}`}
              onClick={e => { e.preventDefault(); navigate(l.path); }}
            >
              <span className="header__menu-num">0{i + 1}</span>
              <span className="header__menu-label">{l.label}</span>
            </a>
          ))}
        </nav>

        <div className="header__menu-foot">
          <div className="header__currency">
            {['USD', 'INR'].map(c => (
              <button key={c} className={`header__currency-btn ${currency === c ? 'active' : ''}`} onClick={() => handleCurrencyChange(c)}>{c}</button>
            ))}
          </div>
          <button className="header__theme-btn" onClick={cycleTheme} title={`Theme: ${themeLabel}`}>
            <span className="header__theme-icon">{themeIcon}</span>
            <span className="header__theme-label">{themeLabel}</span>
          </button>
          <span className="header__menu-hint">Press ESC to close</span>
        </div>
      </div>,
      document.body
    )}
    </React.Fragment>
  );
};

export default Header;
