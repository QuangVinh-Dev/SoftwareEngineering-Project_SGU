import { encodeUrl } from '../utils/encodeUrl';
import { FALLBACK } from '../utils/constants';

export default function PoiCard({
  p, t, getPoiText, onOpenPoi, onOpenPlayer, onOpenMap
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
          onClick={(e) => { e.stopPropagation(); onOpenPlayer(p); }}
          aria-label="Play audio"
        >
          ▶
        </button>
      </div>

      <div className="poi-card__body">
        <div className="poi-card__cat">{txt.tag}</div>
        <h3 className="poi-card__name">{txt.name}</h3>
        <p className="poi-card__desc">{txt.desc}</p>
        <div className="poi-card__meta">
          <span>📍 {txt.dist}</span>
          <span>🎧 5 lang</span>
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
          {t('card.map')}
        </button>
      </div>
    </article>
  );
}