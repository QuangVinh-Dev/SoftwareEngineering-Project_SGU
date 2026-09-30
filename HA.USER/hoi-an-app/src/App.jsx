import { useState, useEffect, useCallback } from 'react';
import { useI18n } from './hooks/useI18n';
import { useTranslation } from './hooks/useTranslation';
import { usePlayer } from './hooks/usePlayer';
import { POIS } from './data/pois';

import Topbar from './components/Topbar';
import Header from './components/Header';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Marquee from './components/Marquee';
import Intro from './components/Intro';
import Routes from './components/Routes';
import Categories from './components/Categories';
import CtaBanner from './components/CtaBanner';
import Footer from './components/Footer';
import PoiModal from './components/PoiModal';
import MapPage from './components/MapPage';
import AllPoisPage from './components/AllPoisPage';
import Player from './components/Player';

export default function App() {
  const { currentLang, setCurrentLang, t } = useI18n();
  const { getPoiText, translateAllPois } = useTranslation(currentLang);
  const player = usePlayer();

  const [modalPoi, setModalPoi] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [mapFocusPoi, setMapFocusPoi] = useState(null);

  /* Sync <html lang> */
  useEffect(() => {
    const map = { ZH:'zh', JA:'ja', KO:'ko', EN:'en', VI:'vi' };
    document.documentElement.lang = map[currentLang] || 'vi';
  }, [currentLang]);

  /* Body scroll lock */
  useEffect(() => {
    const lock = modalPoi || mapOpen || allOpen;
    document.body.classList.toggle('is-lock', !!lock);
    return () => document.body.classList.remove('is-lock');
  }, [modalPoi, mapOpen, allOpen]);

  /* ESC key handler */
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

  /* Translate POIs khi đổi ngôn ngữ */
  useEffect(() => {
    translateAllPois(POIS);
  }, [currentLang, translateAllPois]);

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

  const handleOpenPlayer = useCallback((p, langCode) => {
    const txt = getPoiText(p);
    player.openPlayer(txt.name, langCode);
  }, [getPoiText, player]);

  const handleModalOpenMap = useCallback((p) => {
    setModalPoi(null);
    handleOpenMap(p);
  }, [handleOpenMap]);

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

      <Hero t={t} onOpenMap={() => handleOpenMap()} />

      <Stats t={t} />

      <Marquee />

      <Intro t={t} />

      <Routes
        t={t}
        getPoiText={getPoiText}
        onOpenPoi={handleOpenPoi}
      />

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
        onTogglePlay={player.togglePlay}
        onClose={player.closePlayer}
        onSeek={player.seek}
      />
    </>
  );
}