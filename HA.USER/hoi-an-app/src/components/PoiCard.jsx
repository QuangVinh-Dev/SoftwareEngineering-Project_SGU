// src/components/PoiCard.jsx — chỉ sửa nút play
import { encodeUrl } from '../utils/encodeUrl';
import { FALLBACK } from '../utils/constants';

export default function PoiCard({
  p, t, getPoiText, onOpenPoi, onOpenPlayer, onOpenMap,
}) {
  const txt = getPoiText(p);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenPoi(p);
    }
  };

  return (
    <article
      className="poi-card"
      tabIndex={0}
      role="button"
      aria-label={txt.name}
      onClick={() => onOpenPoi(p)}
      onKeyDown={handleKeyDown}
    >
      <div className="poi-card__thumb">
        <img
          src={encodeUrl(p.imgs[0])}
          alt={txt.name}
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
        />

        <button
          type="button"
          className="poi-card__play"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPlayer(p, 'VI', { priority: 'normal' });
          }}
          aria-label="Play audio"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

      <div className="poi-card__body">
        <div className="poi-card__cat">{txt.tag}</div>
        <h3 className="poi-card__name">{txt.name}</h3>
        <p className="poi-card__desc">{txt.desc}</p>

        <div className="poi-card__meta">
          <span className="poi-card__meta-item">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{txt.dist}</span>
          </span>

          <span className="poi-card__meta-item">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
            <span>5 lang</span>
          </span>
        </div>
      </div>

      <div className="poi-card__foot">
        <button
          type="button"
          className="poi-card__btn poi-card__btn--accent"
          onClick={(e) => { e.stopPropagation(); onOpenPoi(p); }}
        >
          {t('card.detail')}
        </button>
        <button
          type="button"
          className="poi-card__btn"
          onClick={(e) => { e.stopPropagation(); onOpenMap(p); }}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <span>{t('card.map')}</span>
        </button>
      </div>
    </article>
  );
}