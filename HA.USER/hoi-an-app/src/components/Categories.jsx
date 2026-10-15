import PoiCard from './PoiCard';

export default function Categories({
  t, pois = [], loading = false, error = null, getPoiText, onOpenPoi, onOpenPlayer, onOpenMap
}) {
  return (
    <div id="categoriesRoot">
          <section className="cat-section" id="categories">
            <div className="wrap">
              <div className="cat-head">
                <div>
                  <div className="cat-head__num">{t('all.title').toUpperCase()}</div>
                  <h2 className="cat-head__title">{t('all.title')}</h2>
                </div>
                <div className="cat-head__count">{pois.length} {t('count.suffix')}</div>
              </div>
              {error ? <p role="alert">Không thể tải địa điểm: {error}</p> : loading ? <p>Đang tải địa điểm…</p> : pois.length === 0 ? <p>Chưa có địa điểm đang hoạt động.</p> : <div className="poi-grid">
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
              </div>}
            </div>
          </section>
    </div>
  );
}
