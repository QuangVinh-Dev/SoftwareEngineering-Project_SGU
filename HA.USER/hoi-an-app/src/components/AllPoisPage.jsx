import { useState, useMemo } from 'react';
import { POIS } from '../data/pois';
import { CATEGORIES, CAT_ID } from '../data/categories';
import PoiCard from './PoiCard';
import SearchBox from './SearchBox';

export default function AllPoisPage({
  t, getPoiText, onClose, onOpenPoi, onOpenPlayer, onOpenMap
}) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return POIS.filter(p => {
      const txt = getPoiText(p);
      const matchQ = !q
        || txt.name.toLowerCase().includes(q)
        || txt.desc.toLowerCase().includes(q)
        || txt.addr.toLowerCase().includes(q);
      const matchCat = catFilter === 'all' || CAT_ID[p.cat] === catFilter;
      return matchQ && matchCat;
    });
  }, [search, catFilter, getPoiText]);

  return (
    <div className="all-pois-page is-open">
      <div className="all-pois-page__bar">
        <button className="map-page__back" onClick={onClose}>{t('map.back')}</button>
        <div className="map-page__title">{t('all.title')}</div>
        <div className="map-page__count">{filtered.length} {t('count.suffix')}</div>
      </div>

      <div className="all-pois-page__controls">
        <SearchBox value={search} onChange={setSearch} placeholder={t('search.placeholder')} />

        <div className="all-pois-page__filters">
          <button
            className={`chip${catFilter === 'all' ? ' is-active' : ''}`}
            onClick={() => setCatFilter('all')}
          >{t('chips.all')}</button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`chip${catFilter === c.id ? ' is-active' : ''}`}
              onClick={() => setCatFilter(c.id)}
            >{t(c.labelKey)}</button>
          ))}
        </div>
      </div>

      <div className="all-pois-page__body">
        <div className="wrap">
          {filtered.length === 0 ? (
            <div className="all-pois-page__empty">{t('search.empty')}</div>
          ) : (
            <div className="poi-grid">
              {filtered.map(p => (
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
          )}
        </div>
      </div>
    </div>
  );
}