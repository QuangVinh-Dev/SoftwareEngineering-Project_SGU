import React from 'react';
import { POIS } from '../data/pois';

export default function Marquee() {
  const names = POIS.map(p => p.name);
  const html = names.map((n, i) => <span className="marquee__item" key={i}>{n}</span>);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {html}
        {html}
      </div>
    </div>
  );
}