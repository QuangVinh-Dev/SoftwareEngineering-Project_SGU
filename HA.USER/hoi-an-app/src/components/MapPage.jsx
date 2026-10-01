// src/components/MapPage.jsx
import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { POIS } from '../data/pois';
import { CATEGORIES, CAT_ID } from '../data/categories';
import SearchBox from './SearchBox';

const maplibregl = window.maplibregl;

function MapPage({
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

  /* Sidebar đóng mặc định */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---------- Active POI ---------- */
  const setActivePoiId = useCallback((id) => {
    setActivePoi(id);
    Object.entries(markersRef.current).forEach(([key, m]) => {
      m.el.classList.toggle('is-active', +key === id);
    });
  }, []);

  /* ---------- Show popup ---------- */
  const showPopup = useCallback((p) => {
    const map = mapRef.current;
    if (!map) return;
    if (popupRef.current) popupRef.current.remove();

    const txt = getPoiText(p);

    popupRef.current = new maplibregl.Popup({
      offset: 50,
      closeOnClick: false,
      maxWidth: '280px'
    })
      .setLngLat([p.lng, p.lat])
      .setHTML(`<div class="ha-popup">
        <div class="ha-popup__num">${t('cat.' + CAT_ID[p.cat])} · ${p.num}</div>
        <div class="ha-popup__name">${txt.name}</div>
        <div class="ha-popup__meta">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>${txt.dist}</span>
        </div>
        <div class="ha-popup__btns">
          <button class="ha-popup__btn" data-act="detail">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>${t('popup.detail')}</span>
          </button>
          <button class="ha-popup__btn ha-popup__btn--ghost" data-act="audio">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>${t('popup.audio').replace('▶ ', '')}</span>
          </button>
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
      onOpenPlayer(p, 'VI', { priority: 'high', force: true });
      popupRef.current.remove();
      popupRef.current = null;
    });

    map.flyTo({ center: [p.lng, p.lat], zoom: 16.5, duration: 700, essential: true });
  }, [t, getPoiText, onOpenPoi, onOpenPlayer]);

  /* ---------- INIT MAP ---------- */
  useEffect(() => {
    if (mapRef.current) return;
    const container = mapContainerRef.current;
    if (!container) return;

    if (!window.maplibregl) {
      console.error('[MapPage] maplibregl chưa load! Kiểm tra index.html');
      return;
    }

    console.log('[MapPage] Khởi tạo map...');
    const map = new maplibregl.Map({
      container: container,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [108.3275, 15.8770],
      zoom: 14,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false
    });
    mapRef.current = map;

    /* Force resize liên tục 2s đầu */
    let resizeCount = 0;
    const forceResize = () => {
      if (!mapRef.current) return;
      mapRef.current.resize();
      resizeCount++;
      if (resizeCount < 20) {
        setTimeout(forceResize, 100);
      }
    };
    forceResize();

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

    return () => {
      if (popupRef.current) popupRef.current.remove();
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [setActivePoiId, showPopup]);

  /* ---------- ResizeObserver ---------- */
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  /* ---------- Window resize ---------- */
  useEffect(() => {
    const onResize = () => {
      if (mapRef.current) mapRef.current.resize();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  /* ---------- Resize khi toggle sidebar ---------- */
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => mapRef.current.resize(), 320);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  /* ---------- Focus POI ---------- */
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

  /* ---------- Filter logic ---------- */
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

  /* ---------- Apply filter to markers ---------- */
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
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }, [visiblePois]);

  const handleChipClick = (chipId) => setActiveChip(chipId);

  return (
    <div className="map-page is-open">
      <div className="map-page__bar">
        <button className="map-page__back" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{t('map.back').replace('← ', '')}</span>
        </button>

        <div className="map-page__title">{t('map.title')}</div>

        <div className="map-page__count">
          {count} {t('count.suffix')}
        </div>

        <button
          type="button"
          className={`map-page__toggle${sidebarOpen ? ' is-active' : ''}`}
          onClick={() => setSidebarOpen(v => !v)}
          aria-label={sidebarOpen ? 'Ẩn danh sách' : 'Hiện danh sách'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      <div className={`map-layout${sidebarOpen ? ' is-sidebar-open' : ''}`}>
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
            <span className="label">{t('map.near')}</span>
            <button
              type="button"
              className="map-sidebar__close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Đóng danh sách"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>

          <div className="map-sidebar__search">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder={t('search.placeholder')}
            />
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
                  onClick={() => {
                    setActivePoiId(p.id);
                    showPopup(p);
                  }}
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

export default memo(MapPage);