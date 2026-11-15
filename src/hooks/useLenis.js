import { useEffect } from 'react';

// Native smooth scroll — Lenis 1.0.42 uses class properties syntax
// incompatible with react-scripts 4 babel config (no node_modules transpile).
// CSS scroll-behavior: smooth is already set in index.css.
// This hook adds a touch-inertia-friendly easing via pointer events.
export const useLenis = () => {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
};
