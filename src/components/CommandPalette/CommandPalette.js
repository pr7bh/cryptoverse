import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { CryptoState } from '../../CryptoContext';
import { useTheme } from '../../theme/ThemeContext';
import './CommandPalette.css';

const ACTIONS = [
  { id: 'home', label: 'Go to Markets', icon: '◈', action: 'nav', path: '/' },
  { id: 'portfolio', label: 'Open Portfolio', icon: '◎', action: 'nav', path: '/portfolio' },
  { id: 'heatmap', label: 'Market Heatmap', icon: '▦', action: 'nav', path: '/heatmap' },
  { id: 'compare', label: 'Compare Coins', icon: '⊘', action: 'nav', path: '/compare' },
  { id: 'screener', label: 'Market Screener', icon: '⊕', action: 'nav', path: '/screener' },
  { id: 'converter', label: 'Crypto Converter', icon: '⇄', action: 'nav', path: '/converter' },
  { id: 'theme-dark', label: 'Switch to Dark Mode', icon: '☾', action: 'theme', value: 'dark' },
  { id: 'theme-light', label: 'Switch to Light Mode', icon: '☀', action: 'theme', value: 'light' },
  { id: 'theme-system', label: 'Use System Theme', icon: '⊙', action: 'theme', value: 'system' },
  { id: 'usd', label: 'Switch to USD', icon: '$', action: 'currency', value: 'USD' },
  { id: 'inr', label: 'Switch to INR', icon: '₹', action: 'currency', value: 'INR' },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const history = useHistory();
  const { setCurrency } = CryptoState();
  const { setPreference } = useTheme();

  useEffect(function() {
    var handler = function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(function(o) { return !o; });
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return function() { window.removeEventListener('keydown', handler); };
  }, []);

  useEffect(function() {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  var filtered = ACTIONS.filter(function(a) {
    return a.label.toLowerCase().includes(query.toLowerCase());
  });

  var handleKeyDown = function(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(function(s) { return Math.min(s + 1, filtered.length - 1); }); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(function(s) { return Math.max(s - 1, 0); }); }
    if (e.key === 'Enter' && filtered[selected]) execute(filtered[selected]);
  };

  var execute = function(action) {
    setOpen(false);
    setQuery('');
    if (action.action === 'nav') history.push(action.path);
    if (action.action === 'theme') setPreference(action.value);
    if (action.action === 'currency') setCurrency(action.value);
  };

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={function(e) { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="cmd-palette">
        <div className="cmd-search">
          <span className="cmd-icon">⌕</span>
          <input
            ref={inputRef}
            className="cmd-input"
            type="text"
            placeholder="Search commands, navigate..."
            value={query}
            onChange={function(e) { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="cmd-esc">ESC</kbd>
        </div>
        <div className="cmd-results">
          {filtered.length === 0 ? (
            <div className="cmd-empty">No results for "{query}"</div>
          ) : filtered.map(function(a, i) {
            return (
              <button
                key={a.id}
                className={'cmd-item' + (i === selected ? ' active' : '')}
                onClick={function() { execute(a); }}
                onMouseEnter={function() { setSelected(i); }}
              >
                <span className="cmd-item-icon">{a.icon}</span>
                <span className="cmd-item-label">{a.label}</span>
                <span className="cmd-item-arrow">↵</span>
              </button>
            );
          })}
        </div>
        <div className="cmd-footer">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>ESC close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
