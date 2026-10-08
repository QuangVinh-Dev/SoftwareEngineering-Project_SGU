// src/components/PoiModal.jsx
import { useState, useEffect } from 'react';
import { LANGS } from '../data/langs';
import { CAT_ID } from '../data/categories';
import { encodeUrl } from '../utils/encodeUrl';
import { FALLBACK } from '../utils/constants';

const flagSrc = (cc) => `https://flagcdn.com/w40/${cc}.png`;
const flagImg = (cc, alt) => (
  <img className="flag" src={flagSrc(cc)} alt={alt || ''} width="24" height="16" loading="lazy" />
);

export default function PoiModal({
  poi, t, getPoiText, onClose, onOpenPlayer, onOpenMap,
}) {
  const [activeImg, setActiveImg] = useState(0);
  const [activeAudioLang, setActiveAudioLang] = useState(0);

  useEffect(() => {
    setActiveImg(0);
    setActiveAudioLang(0);
  }, [poi?.id]);

  if (!poi) return null;

  const txt = getPoiText(poi);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`;

  return (
    <div
      className="poi-modal is-open"
      onClick={(e) => {
        if (e.target.classList.contains('poi-modal')) onClose();
      }}
    >
      <div className="poi-modal__box">
        <button className="poi-modal__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <div className="poi-modal__gallery">
          {poi.imgs.map((src, i) => (
            <img
              key={i}
              src={encodeUrl(src)}
              alt={txt.name}
              className={i === activeImg ? 'is-active' : ''}
              onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
            />
          ))}
          <div className="poi-modal__thumbs">
            {poi.imgs.map((src, i) => (
              <button
                key={i}
                type="button"
                className={`poi-modal__thumb${i === activeImg ? ' is-active' : ''}`}
                onClick={() => setActiveImg(i)}
              >
                <img
                  src={encodeUrl(src)}
                  alt=""
                  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="poi-modal__info">
          <div className="poi-modal__num">
            {t('cat.' + CAT_ID[poi.cat])} · {poi.num}
          </div>
          <h2 className="poi-modal__name">{txt.name}</h2>
          <span className="poi-modal__tag">{txt.tag}</span>
          <p className="poi-modal__desc">{txt.desc}</p>

          <div className="poi-modal__meta">
            <div className="poi-modal__meta-item">
              <span className="poi-modal__meta-label">{t('modal.dist')}</span>
              <span className="poi-modal__meta-val">{txt.dist}</span>
            </div>
            <div className="poi-modal__meta-item">
              <span className="poi-modal__meta-label">{t('modal.hours')}</span>
              <span className="poi-modal__meta-val">{txt.hours}</span>
            </div>
            <div className="poi-modal__meta-item">
              <span className="poi-modal__meta-label">{t('modal.price')}</span>
              <span className="poi-modal__meta-val">{txt.price}</span>
            </div>
            <div className="poi-modal__meta-item">
              <span className="poi-modal__meta-label">{t('modal.addr')}</span>
              <span className="poi-modal__meta-val">{txt.addr}</span>
            </div>
          </div>
        </div>

        <div className="poi-modal__body">
          <section>
            <h3 className="poi-modal__section-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: '0.4rem' }}>
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              {t('modal.videoTitle')}
            </h3>
            <div className="poi-modal__video">
              {poi.video && (
                <iframe
                  src={poi.video}
                  title={txt.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </section>

          <section>
            <h3 className="poi-modal__section-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: '0.4rem' }}>
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              {t('modal.audioTitle')}
            </h3>
            <div className="audio-langs">
              {LANGS.map((L, i) => (
                <button
                  key={L.code}
                  type="button"
                  className={`audio-lang${i === activeAudioLang ? ' is-active' : ''}`}
                  onClick={() => {
                    setActiveAudioLang(i);
                    onOpenPlayer(poi, L.code, { priority: 'high', force: true });
                  }}
                >
                  <span className="audio-lang__flag">{flagImg(L.cc, L.name)}</span>
                  <span className="audio-lang__name">{L.name}</span>
                  <span className="audio-lang__dur">{L.dur}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="poi-modal__section-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: '0.4rem' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {t('modal.galleryTitle')}
            </h3>
            <div className="poi-modal__gallery-grid">
              {poi.imgs.map((src, i) => (
                <img
                  key={i}
                  src={encodeUrl(src)}
                  alt={txt.name}
                  onClick={() => setActiveImg(i)}
                  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
                />
              ))}
            </div>
          </section>

          <div className="poi-modal__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onOpenPlayer(poi, 'VI', { priority: 'high', force: true })}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" style={{ marginRight: '0.4rem', verticalAlign: '-2px' }}>
                <path d="M8 5v14l11-7z" />
              </svg>
              {t('modal.play').replace('▶ ', '')}
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => onOpenMap(poi)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '0.4rem', verticalAlign: '-2px' }}>
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              {t('modal.map').replace('🗺 ', '')}
            </button>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '0.4rem', verticalAlign: '-2px' }}>
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              {t('modal.directions').replace('🧭 ', '')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}