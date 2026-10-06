import React, { useEffect, useRef, useState } from 'react';

function StatNum({ value }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting || animated.current) return;
        animated.current = true;
        const tv = +value;
        const step = Math.max(1, Math.floor(tv / 30));
        let c = 0;
        const id = setInterval(() => {
          c = Math.min(c + step, tv);
          setDisplay(String(c));
          if (c >= tv) clearInterval(id);
        }, 30);
        io.unobserve(el);
      });
    }, { threshold: .4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return <span className="stat__num" ref={ref}>{display}</span>;
}

export default function Stats({ t }) {
  return (
    <div className="stats">
      <div className="stat"><StatNum value="20" /><span className="stat__label">{t('stat.pois')}</span></div>
      <div className="stat"><StatNum value="5" /><span className="stat__label">{t('stat.cats')}</span></div>
      <div className="stat"><StatNum value="5" /><span className="stat__label">{t('stat.langs')}</span></div>
      <div className="stat"><span className="stat__num">24/7</span><span className="stat__label">{t('stat.guide')}</span></div>
    </div>
  );
}