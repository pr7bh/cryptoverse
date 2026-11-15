import React, { useState, useEffect, useCallback } from 'react';
import { ThemeContext } from './ThemeContext';

const LS_KEY = 'cv_theme';

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

const resolveTheme = (pref) => pref === 'system' ? getSystemTheme() : pref;

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
};

export const ThemeProvider = ({ children }) => {
  const [preference, setPreferenceState] = useState(() => {
    try { return localStorage.getItem(LS_KEY) || 'dark'; }
    catch { return 'dark'; }
  });

  const theme = resolveTheme(preference);

  const setPreference = useCallback((pref) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
    }
    setPreferenceState(pref);
    try { localStorage.setItem(LS_KEY, pref); } catch {}
    applyTheme(resolveTheme(pref));
  }, []);

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => applyTheme(e.matches ? 'light' : 'dark');
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    } else {
      mq.addListener(handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, [preference]);

  return (
    <ThemeContext.Provider value={{ preference, theme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
};
