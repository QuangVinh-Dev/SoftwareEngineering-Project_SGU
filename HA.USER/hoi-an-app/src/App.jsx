// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from './hooks/useI18n';
import { useTranslation } from './hooks/useTranslation';
import { usePlayer } from './hooks/usePlayer';
import { usePoiLocation } from './hooks/useGeofence';
import { useServiceAccess } from './hooks/useServiceAccess';
import { playPoiAudio } from './services/audioService';
import { getPoiLocations } from './services/poiService';
import { POIS } from './data/pois';

import Topbar from './components/Topbar';
import Header from './components/Header';
import Hero from './components/Hero';
import Intro from './components/Intro';
import Routes from './components/Routes';
import Categories from './components/Categories';
import CtaBanner from './components/CtaBanner';
import Footer from './components/Footer';
import PoiModal from './components/PoiModal';
import MapPage from './components/MapPage';
import AllPoisPage from './components/AllPoisPage';
import Player from './components/Player';
import PaymentGate from './components/PaymentGate';
import { startVisitorTracking } from './services/visitorTracker';

function formatRemainingTime(seconds) {
  const total = Math.max(0, Math.ceil(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  return `${String(hours).padStart(2, '0')} giờ ${String(minutes).padStart(2, '0')} phút ${String(remainingSeconds).padStart(2, '0')} giây`;
}

function HeritageClockWidget({ access }) {
  const [minimized, setMinimized] = useState(false);
  const total = Math.max(0, Math.ceil(Number(access.secondsRemaining) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const expiryFormatted = access.expiresAt ? new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(access.expiresAt)) : '';

  if (minimized) {
    return (
      <button
        type="button"
        className="hcw-minimized"
        onClick={() => setMinimized(false)}
        title="Bấm để xem chi tiết thời gian sử dụng"
      >
        <span className="hcw__live-dot" />
        
        <span className="hcw-minimized__time">{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
      </button>
    );
  }

  return (
    <aside className="heritage-clock-widget" aria-label="Thời gian sử dụng dịch vụ">
      <div className="hcw__header">
        <div className="hcw__badge">
          <span className="hcw__live-dot" />
          <span className="hcw__title">HỘI AN TOUR PASS</span>
        </div>
        <button
          type="button"
          className="hcw__toggle-btn"
          onClick={() => setMinimized(true)}
          title="Thu nhỏ"
          aria-label="Thu nhỏ đồng hồ"
        >
          ─
        </button>
      </div>

      <div className="hcw__timer">
        <div className="hcw__unit">
          <span className="hcw__num">{String(hours).padStart(2, '0')}</span>
          <span className="hcw__label">GIỜ</span>
        </div>
        <span className="hcw__sep">:</span>
        <div className="hcw__unit">
          <span className="hcw__num">{String(minutes).padStart(2, '0')}</span>
          <span className="hcw__label">PHÚT</span>
        </div>
        <span className="hcw__sep">:</span>
        <div className="hcw__unit">
          <span className="hcw__num">{String(seconds).padStart(2, '0')}</span>
          <span className="hcw__label">GIÂY</span>
        </div>
      </div>

      <div className="hcw__footer">
        <span className="hcw__expiry-label">Hết hạn:</span>
        <strong className="hcw__expiry-val">{expiryFormatted}</strong>
      </div>
    </aside>
  );
}

export default function App() {
  const access = useServiceAccess();
  const { currentLang, setCurrentLang, t } = useI18n();
  const { getPoiText, translateAllPois } = useTranslation(currentLang);
  const player = usePlayer();
  const audioRequestRef = useRef(0);
  const previousLanguageRef = useRef(currentLang);
  const [playerPoi, setPlayerPoi] = useState(null);
  const [playerLang, setPlayerLang] = useState(currentLang);
  const [pois, setPois] = useState(() => POIS);
  const [poiLoading, setPoiLoading] = useState(false);
  const [poiError, setPoiError] = useState(null);

  const [modalPoi, setModalPoi] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [mapFocusPoi, setMapFocusPoi] = useState(null);

  useEffect(() => {
    return startVisitorTracking();
  }, []);

  const unlocked = access.status === 'active';

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    setPoiLoading(true);
    getPoiLocations().then(data => {
      if (!cancelled) { setPois(data); setPoiError(null); }
    }).catch(error => {
      if (!cancelled) { setPois([]); setPoiError(error.message || 'Không tải được danh sách địa điểm.'); }
    }).finally(() => { if (!cancelled) setPoiLoading(false); });
    return () => { cancelled = true; };
  }, [unlocked]);

  // ----------------------------------------------------------------
  // Automatic POI audio playback by GPS
  // Enabled only when:
  //   - user has unlocked the tour
  //   - no modal/map/allPois overlay is open
  //   - player is not already open (avoid audio interruption)
  // ----------------------------------------------------------------
  const gpsEnabled = unlocked && !modalPoi && !mapOpen && !allOpen && !player.isOpen;

  const { gpsError, error: poiApiError } = usePoiLocation({
    enabled: gpsEnabled,
    currentLang,
    openPlayerFn: player.openPlayer,
    suppliedPois: pois,
  });

  // Log GPS / API errors in development — don't crash the app
  useEffect(() => {
    if (gpsError) console.warn('[App] GPS error:', gpsError);
  }, [gpsError]);

  useEffect(() => {
    if (poiApiError) console.warn('[App] POI API error:', poiApiError);
  }, [poiApiError]);

  /* Sync <html lang> */
  useEffect(() => {
    const map = { ZH: 'zh', JA: 'ja', KO: 'ko', EN: 'en', VI: 'vi' };
    document.documentElement.lang = map[currentLang] || 'vi';
  }, [currentLang]);

  /* Body scroll lock */
  useEffect(() => {
    const lock = modalPoi || mapOpen || allOpen;
    document.body.classList.toggle('is-lock', !!lock);
    return () => document.body.classList.remove('is-lock');
  }, [modalPoi, mapOpen, allOpen]);

  /* ESC */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (modalPoi) setModalPoi(null);
      else if (mapOpen) setMapOpen(false);
      else if (allOpen) setAllOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalPoi, mapOpen, allOpen]);

  /* Translate */
  useEffect(() => {
    if (unlocked) translateAllPois(pois);
  }, [currentLang, translateAllPois, unlocked, pois]);

  /* Handlers */
  const handleSetLang = useCallback((code) => setCurrentLang(code), [setCurrentLang]);
  const handleOpenPoi = useCallback((p) => setModalPoi(p), []);
  const handleClosePoi = useCallback(() => setModalPoi(null), []);

  const handleOpenMap = useCallback((p) => {
    setMapFocusPoi(p || null);
    setMapOpen(true);
  }, []);
  const handleCloseMap = useCallback(() => {
    setMapOpen(false);
    setMapFocusPoi(null);
  }, []);

  const handleOpenAll = useCallback(() => setAllOpen(true), []);
  const handleCloseAll = useCallback(() => setAllOpen(false), []);

  /* 4.2 — Phát khi chạm vào POI */
  const handleOpenPlayer = useCallback((p, langCode) => {
    if (!p) return;
    ++audioRequestRef.current;
    setPlayerPoi(p);
    setPlayerLang(langCode || currentLang);
    player.closePlayer();
  }, [currentLang, player.closePlayer]);

  useEffect(() => {
    if (previousLanguageRef.current !== currentLang) {
      previousLanguageRef.current = currentLang;
      if (playerPoi) setPlayerLang(currentLang);
    }
  }, [currentLang, playerPoi]);

  // Keep the open player bound to its selected POI and current language.
  // A sequence token prevents a slower response for an older language/POI
  // from replacing the latest selection.
  useEffect(() => {
    if (!playerPoi) return;
    const requestId = ++audioRequestRef.current;
    const controller = new AbortController();
    player.openPlayer(playerPoi.name, playerLang, playerPoi.id, null, { loading: true });
    playPoiAudio(playerPoi, playerLang, player.openPlayer,
      () => audioRequestRef.current === requestId,
      { signal: controller.signal, triggerMethod: 'TAP' });
    return () => {
      controller.abort();
      ++audioRequestRef.current;
    };
  }, [playerPoi, playerLang, player.openPlayer]);

  const handleClosePlayer = useCallback(() => {
    ++audioRequestRef.current;
    setPlayerPoi(null);
    player.closePlayer();
  }, [player.closePlayer]);

  useEffect(() => {
    if (access.status !== 'active' && player.isOpen) handleClosePlayer();
  }, [access.status, handleClosePlayer, player.isOpen]);

  const handleModalOpenMap = useCallback((p) => {
    setModalPoi(null);
    handleOpenMap(p);
  }, [handleOpenMap]);

  if (!unlocked) {
    return (
      <PaymentGate
        onUnlock={access.activate}
        accessStatus={access.status}
        accessError={access.error}
        onRetryAccess={access.refresh}
      />
    );
  }

  return (
    <>
      <Topbar t={t} />
      <HeritageClockWidget access={access} />
      {access.justActivated && (
        <p className="service-access__notice" role="status">
          Thanh toán đã được Backend xác nhận. Quyền sử dụng đã kích hoạt.
        </p>
      )}
      <Header
        t={t}
        currentLang={currentLang}
        setLang={handleSetLang}
        onOpenMap={() => handleOpenMap()}
        onOpenAll={handleOpenAll}
      />

      <Hero onOpenMap={() => handleOpenMap()} />
      <Intro t={t} />

      <Routes t={t} pois={pois} loading={poiLoading} error={poiError} getPoiText={getPoiText} onOpenPoi={handleOpenPoi} />

      <Categories
        t={t}
        pois={pois}
        loading={poiLoading}
        error={poiError}
        getPoiText={getPoiText}
        onOpenPoi={handleOpenPoi}
        onOpenPlayer={handleOpenPlayer}
        onOpenMap={(p) => handleOpenMap(p)}
      />

      <CtaBanner t={t} onOpenMap={() => handleOpenMap()} />
      <Footer t={t} onOpenMap={() => handleOpenMap()} />

      {modalPoi && (
        <PoiModal
          poi={modalPoi}
          t={t}
          getPoiText={getPoiText}
          onClose={handleClosePoi}
          onOpenPlayer={handleOpenPlayer}
          onOpenMap={handleModalOpenMap}
        />
      )}

      {mapOpen && (
        <MapPage
          t={t}
          pois={pois}
          loading={poiLoading}
          error={poiError}
          getPoiText={getPoiText}
          onClose={handleCloseMap}
          focusPoi={mapFocusPoi}
          onOpenPoi={handleOpenPoi}
          onOpenPlayer={handleOpenPlayer}
        />
      )}

      {allOpen && (
        <AllPoisPage
          t={t}
          pois={pois}
          loading={poiLoading}
          error={poiError}
          getPoiText={getPoiText}
          onClose={handleCloseAll}
          onOpenPoi={handleOpenPoi}
          onOpenPlayer={handleOpenPlayer}
          onOpenMap={(p) => { setAllOpen(false); handleOpenMap(p); }}
        />
      )}

      <Player
        isOpen={player.isOpen}
        isPlaying={player.isPlaying}
        isLoading={player.isLoading}
        progress={player.progress}
        timeText={player.timeText}
        title={player.title}
        meta={player.meta}
        queueLength={player.queueLength}
        onTogglePlay={player.togglePlay}
        onClose={handleClosePlayer}
        onSeek={player.seek}
      />
    </>
  );
}
