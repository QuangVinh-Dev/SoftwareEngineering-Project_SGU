import React from 'react';
import { encodeUrl } from '../utils/encodeUrl';
import { FALLBACK } from '../utils/constants';

const HERO_IMG = 'https://i.pinimg.com/736x/a7/8d/e7/a78de749db97382fad8ab415c2a13957.jpg';

export default function Hero({ t, onOpenMap }) {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero__grid">
          <div>
            <div className="hero__eyebrow">
              <span className="label">{t('hero.badge')}</span>
            </div>
            <h1 className="h-hero">
              <span className="outline">{t('hero.line1')}</span>
              <span className="accent">{t('hero.line2')}</span>
              <span>{t('hero.line3')}</span>
            </h1>
            <p className="hero__lead">{t('hero.lead')}</p>
            <div className="hero__actions">
              <button type="button" className="btn btn--primary" onClick={onOpenMap}>
                {t('hero.cta.map')}
              </button>
              <a href="#di-san" className="btn">{t('hero.cta.heritage')}</a>
            </div>
          </div>
          <div className="hero__photo">
            <div className="hero__frame">
              <img
                src={encodeUrl(HERO_IMG)}
                alt="Hội An"
                onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
              />
            </div>
            <div className="hero__stamp">{t('hero.stamp')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}