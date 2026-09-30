import { useState, useEffect } from 'react';
import { LANGS } from '../data/langs';
import { CAT_ID } from '../data/categories';
import { encodeUrl } from '../utils/encodeUrl';
import { FALLBACK } from '../utils/constants';

const flagSrc = cc => `https://flagcdn.com/w40/${cc}.png`;
const flagImg = (cc, alt) => (
  <img className="flag" src={flagSrc(cc)} alt={alt || ''} width="24" height="16" loading="lazy" />
);

export default function PoiModal({
  poi, t, getPoiText, onClose, onOpenPlayer, onOpenMap
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
    <div className="poi-modal is-open" onClick={(e) => { if (e.target.classList.contains('poi-modal')) onClose(); }}>
      <div className="poi-modal__box">
        <button className="poi-modal__close" onClick={onClose} aria-label="Close">✕</button>

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
            <h3 className="poi-modal__section-title">{t('modal.videoTitle')}</h3>
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
            <h3 className="poi-modal__section-title">{t('modal.audioTitle')}</h3>
            <div className="audio-langs">
              {LANGS.map((L, i) => (
                <button
                  key={L.code}
                  type="button"
                  className={`audio-lang${i === activeAudioLang ? ' is-active' : ''}`}
                  onClick={() => { setActiveAudioLang(i); onOpenPlayer(poi, L.code); }}
                >
                  <span className="audio-lang__flag">{flagImg(L.cc, L.name)}</span>
                  <span className="audio-lang__name">{L.name}</span>
                  <span className="audio-lang__dur">{L.dur}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="poi-modal__section-title">{t('modal.galleryTitle')}</h3>
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
              onClick={() => onOpenPlayer(poi)}
            >
              {t('modal.play')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenMap(poi)}
            >
              {t('modal.map')}
            </button>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              onClick={(e) => e.stopPropagation()}
            >
              🧭 {t('modal.directions')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}