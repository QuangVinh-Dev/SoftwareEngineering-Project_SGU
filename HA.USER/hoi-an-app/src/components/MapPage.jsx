import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { POIS } from '../data/pois';
import { CATEGORIES, CAT_ID } from '../data/categories';
import SearchBox from './SearchBox';

const maplibregl = window.maplibregl;

export default function MapPage({
  t, getPoiText, onClose, focusPoi, onOpenPoi, onOpenPlayer
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const popupRef = useRef(null);
  const [activePoi, setActivePoi] = useState(null);
  const [activeChip, setActiveChip] = useState('all');
  const [search, setSearch] = useState('');
  const [count, setCount] = useState(POIS.length);
  const [mapReady, setMapReady] = useState(false);

  const setActivePoiId = useCallback((id) => {
    setActivePoi(id);
    Object.entries(markersRef.current).forEach(([key, m]) => {
      m.el.classList.toggle('is-active', +key === id);
    });
  }, []);

  const showPopup = useCallback((p) => {
    const map = mapRef.current;
    if (!map) return;
    if (popupRef.current) popupRef.current.remove();

    const txt = getPoiText(p);
    popupRef.current = new maplibregl.Popup({ offset: 50, closeOnClick: false, maxWidth: '280px' })
      .setLngLat([p.lng, p.lat])
      .setHTML(`<div class="ha-popup">
        <div class="ha-popup__num">${t('cat.' + CAT_ID[p.cat])} · ${p.num}</div>
        <div class="ha-popup__name">${txt.name}</div>
        <div class="ha-popup__meta">📍 ${txt.dist}</div>
        <div class="ha-popup__btns">
          <button class="ha-popup__btn" data-act="detail">${t('popup.detail')}</button>
          <button class="ha-popup__btn ha-popup__btn--ghost" data-act="audio">${t('popup.audio')}</button>
        </div>
      </div>`)
      .addTo(map);

    const el = popupRef.current.getElement();
    el.querySelector('[data-act="detail"]').addEventListener('click', () => {
      onOpenPoi(p);
      popupRef.current.remove();
      popupRef.current = null;
    });
    el.querySelector('[data-act="audio"]').addEventListener('click', () => {
      onOpenPlayer(p);
      popupRef.current.remove();
      popupRef.current = null;
    });

    map.flyTo({ center: [p.lng, p.lat], zoom: 16.5, duration: 700, essential: true });
  }, [t, getPoiText, onOpenPoi, onOpenPlayer]);

  /* INIT MAP */
  useEffect(() => {
    if (mapRef.current) return;
    const container = mapContainerRef.current;
    if (!container || !window.maplibregl) return;

    console.log('[MapPage] Khởi tạo map...');
    const map = new maplibregl.Map({
      container: container,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [108.3275, 15.8770],
      zoom: 14,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false
    });
    mapRef.current = map;

    map.on('load', () => {
      console.log('[MapPage] Map loaded OK');
      setMapReady(true);
      map.resize();
    });
    map.on('error', (e) => console.warn('[MapPage] error:', e));

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: false
      }),
      'top-right'
    );
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    /* Markers */
    POIS.forEach(p => {
      const el = document.createElement('div');
      el.className = 'ha-marker';
      el.innerHTML = `<div class="ha-marker__pin"><b>${p.num}</b></div>`;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setActivePoiId(p.id);
        showPopup(p);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markersRef.current[p.id] = { el, marker };
    });

    const t1 = setTimeout(() => map.resize(), 100);
    const t2 = setTimeout(() => map.resize(), 400);
    const t3 = setTimeout(() => map.resize(), 800);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      if (popupRef.current) popupRef.current.remove();
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [setActivePoiId, showPopup]);

  useEffect(() => {
    const onResize = () => { if (mapRef.current) mapRef.current.resize(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (focusPoi && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current.resize();
        setActivePoiId(focusPoi.id);
        showPopup(focusPoi);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [focusPoi, setActivePoiId, showPopup]);

  /* Filter logic */
  const visiblePois = useMemo(() => {
    const q = search.trim().toLowerCase();
    return POIS.filter(p => {
      const txt = getPoiText(p);
      const matchQ = !q
        || txt.name.toLowerCase().includes(q)
        || txt.desc.toLowerCase().includes(q)
        || txt.addr.toLowerCase().includes(q);

      const matchChip = activeChip === 'all' || CAT_ID[p.cat] === activeChip;

      return matchQ && matchChip;
    });
  }, [search, activeChip, getPoiText]);

  useEffect(() => {
    const visibleIds = new Set(visiblePois.map(p => p.id));
    let n = 0;
    POIS.forEach(p => {
      const show = visibleIds.has(p.id);
      if (show) n++;
      const m = markersRef.current[p.id];
      if (m) m.el.style.display = show ? '' : 'none';
    });
    setCount(n);
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
  }, [visiblePois]);

  const handleChipClick = (chipId) => setActiveChip(chipId);

  return (
    <div className="map-page is-open">
      <div className="map-page__bar">
        <button className="map-page__back" onClick={onClose}>{t('map.back')}</button>
        <div className="map-page__title">{t('map.title')}</div>
        <div className="map-page__count">{count} {t('count.suffix')}</div>
      </div>

      <div className="map-layout">
        <div className="map-canvas">
          <div ref={mapContainerRef} id="map" />
          <div className="map-overlay">GPS · 50M</div>
          {!mapReady && (
            <div className="map-loading">
              <div className="map-loading__spinner" />
              <div className="map-loading__text">{t('map.loading')}</div>
            </div>
          )}
        </div>

        <aside className="map-sidebar">
          <div className="map-sidebar__head">
            <span className="label" style={{ color: 'var(--accent)' }}>{t('map.near')}</span>
          </div>

          <div className="map-sidebar__search">
            <SearchBox value={search} onChange={setSearch} placeholder={t('search.placeholder')} />
          </div>

          <div className="filter-panel">
            <div className="filter-group">
              <div className="filter-group__label">{t('filter.topic')}</div>
              <div className="filter-scroll">
                <button
                  className={`filter-btn${activeChip === 'all' ? ' is-active' : ''}`}
                  onClick={() => handleChipClick('all')}
                >
                  {t('chips.all')}
                </button>
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    className={`filter-btn${activeChip === c.id ? ' is-active' : ''}`}
                    onClick={() => handleChipClick(c.id)}
                  >
                    {t(c.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="map-sidebar__count">
            <strong>{count}</strong> {t('count.suffix')}
          </div>

          <ul className="map-sidebar__list">
            {visiblePois.length === 0 ? (
              <li className="poi-item poi-item--empty">{t('search.empty')}</li>
            ) : visiblePois.map(p => {
              const txt = getPoiText(p);
              return (
                <li
                  key={p.id}
                  className={`poi-item${activePoi === p.id ? ' is-active' : ''}`}
                  onClick={() => { setActivePoiId(p.id); showPopup(p); }}
                >
                  <div className="poi-item__num">{p.num}</div>
                  <div>
                    <div className="poi-item__name">{txt.name}</div>
                    <div className="poi-item__meta">{t('cat.' + CAT_ID[p.cat])}</div>
                  </div>
                  <div className="poi-item__dist">{txt.dist}</div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}