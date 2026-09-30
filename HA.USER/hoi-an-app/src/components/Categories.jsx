import { CATEGORIES } from '../data/categories';
import { POIS } from '../data/pois';
import PoiCard from './PoiCard';

export default function Categories({
  t, getPoiText, onOpenPoi, onOpenPlayer, onOpenMap
}) {
  return (
    <div id="categoriesRoot">
      {CATEGORIES.map(cat => {
        const pois = POIS.filter(p => p.cat === cat.name);
        if (!pois.length) return null;
        return (
          <section className="cat-section" id={cat.id} key={cat.id}>
            <div className="wrap">
              <div className="cat-head">
                <div>
                  <div className="cat-head__num">{t(cat.labelKey).toUpperCase()}</div>
                  <h2 className="cat-head__title">{t(cat.labelKey)}</h2>
                </div>
                <div className="cat-head__count">{pois.length} {t('count.suffix')}</div>
              </div>
              <div className="poi-grid">
                {pois.map(p => (
                  <PoiCard
                    key={p.id}
                    p={p}
                    t={t}
                    getPoiText={getPoiText}
                    onOpenPoi={onOpenPoi}
                    onOpenPlayer={onOpenPlayer}
                    onOpenMap={onOpenMap}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}