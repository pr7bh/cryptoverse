import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export const useScrollReveal = (selector, options) => {
  const ref = useRef(null);
  const opts = options || {};
  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = ref.current.querySelectorAll(selector);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        els,
        { opacity: 0, y: opts.y !== undefined ? opts.y : 40 },
        {
          opacity: 1,
          y: 0,
          duration: opts.duration !== undefined ? opts.duration : 0.8,
          stagger: opts.stagger !== undefined ? opts.stagger : 0.1,
          ease: opts.ease || 'power3.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 80%',
            once: true,
          },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [selector]); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
};
