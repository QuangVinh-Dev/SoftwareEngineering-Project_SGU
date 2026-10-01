// src/components/Intro.jsx
import React from 'react';
import { encodeUrl } from '../utils/encodeUrl';
import { FALLBACK } from '../utils/constants';
import heroImg from '../assets/POI/banner.jpg';

export default function Intro({ t }) {
  return (
    <section className="intro" id="gioi-thieu">
      <div className="wrap">

        <div className="intro__head">
          <span className="intro__chapter">{t('intro.chapter')}</span>
          <h2 className="intro__title">Phố cổ bên sông Hoài</h2>
        </div>

        <div className="intro__body">
          <div className="intro__image">
            <img
              src={encodeUrl(heroImg)}
              alt="Hội An"
              loading="lazy"
              onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
            />
          </div>
          <div className="intro__text">
            <p>{t('intro.p1')}</p>
            <p>{t('intro.p2')}</p>
            <p>{t('intro.p3')}</p>
            <p>{t('intro.p4')}</p>
            <p>{t('intro.p5')}</p>
          </div>
        </div>

      </div>
    </section>
  );
}