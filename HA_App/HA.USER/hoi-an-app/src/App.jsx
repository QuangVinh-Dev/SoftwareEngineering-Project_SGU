// src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from './hooks/useI18n';
import { useTranslation } from './hooks/useTranslation';
import { usePlayer } from './hooks/usePlayer';
import { usePoiLocation } from './hooks/useGeofence';
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

/* ============================================================
   Tạo text ngắn để đọc: name + câu đầu của desc
   Tránh đọc desc dài → không giật map
   ============================================================ */
function buildSpeechText(txt) {
  if (!txt) return '';
  const name = (txt.name || '').trim();
  const desc = (txt.desc || '').trim();

  if (!desc) return name;

  // Lấy câu đầu tiên (kết thúc bởi . ! ? hoặc hết chuỗi)
  const firstSentence = desc.split(/(?<=[.!?])\s+/)[0] || desc;
  const shortDesc = firstSentence.length > 150
    ? firstSentence.slice(0, 147).trim() + '...'
    : firstSentence;

  return `${name}. ${shortDesc}`;
}

export default function App() {
  const { currentLang, setCurrentLang, t } = useI18n();
  const { getPoiText, translateAllPois } = useTranslation(currentLang);
  const player = usePlayer();

  const [modalPoi, setModalPoi] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [mapFocusPoi, setMapFocusPoi] = useState(null);

  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('hoian_unlocked') === '1';
  });

  const handleUnlock = useCallback(() => {
    sessionStorage.setItem('hoian_unlocked', '1');
    setUnlocked(true);
  }, []);

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
    if (unlocked) translateAllPois(POIS);
  }, [currentLang, translateAllPois, unlocked]);

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
  const handleOpenPlayer = useCallback((p, langCode, opts = {}) => {
    const txt = getPoiText(p);
    const speechText = buildSpeechText(txt);
    player.openPlayer(txt.name, langCode || currentLang, p.id, speechText, opts);
  }, [getPoiText, currentLang, player]);

  const handleModalOpenMap = useCallback((p) => {
    setModalPoi(null);
    handleOpenMap(p);
  }, [handleOpenMap]);

  if (!unlocked) {
    return <PaymentGate onUnlock={handleUnlock} />;
  }

  return (
    <>
      <Topbar t={t} />
      <Header
        t={t}
        currentLang={currentLang}
        setLang={handleSetLang}
        onOpenMap={() => handleOpenMap()}
        onOpenAll={handleOpenAll}
      />

      <Hero onOpenMap={() => handleOpenMap()} />
      <Intro t={t} />

      <Routes t={t} getPoiText={getPoiText} onOpenPoi={handleOpenPoi} />

      <Categories
        t={t}
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
        progress={player.progress}
        timeText={player.timeText}
        title={player.title}
        meta={player.meta}
        queueLength={player.queueLength}
        onTogglePlay={player.togglePlay}
        onClose={player.closePlayer}
        onSeek={player.seek}
      />
    </>
  );
}