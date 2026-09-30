import React from 'react';
import { encodeUrl } from '../utils/encodeUrl';
import { FALLBACK } from '../utils/constants';
import { POIS } from '../data/pois';

export default function Intro({ t }) {
  const img1 = POIS[1].imgs[0];
  const img2 = POIS[9].imgs[0];

  return (
    <section className="intro" id="gioi-thieu">
      <div className="wrap">
        <div className="intro__grid">
          <div>
            <h2 className="intro__title">{t('intro.title')}</h2>
            <div className="intro__imgs">
              <img
                src={encodeUrl(img1)}
                alt=""
                loading="lazy"
                onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
              />
              <img
                src={encodeUrl(img2)}
                alt=""
                loading="lazy"
                onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
              />
            </div>
          </div>
          <p className="intro__p">{t('intro.p')}</p>
        </div>
        <div className="feats">
          <div className="feat">
            <span className="feat__icon">🗺</span>
            <h3 className="feat__title">{t('feat1.t')}</h3>
            <p className="feat__desc">{t('feat1.d')}</p>
          </div>
          <div className="feat">
            <span className="feat__icon">🎧</span>
            <h3 className="feat__title">{t('feat2.t')}</h3>
            <p className="feat__desc">{t('feat2.d')}</p>
          </div>
          <div className="feat">
            <span className="feat__icon">📷</span>
            <h3 className="feat__title">{t('feat3.t')}</h3>
            <p className="feat__desc">{t('feat3.d')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}