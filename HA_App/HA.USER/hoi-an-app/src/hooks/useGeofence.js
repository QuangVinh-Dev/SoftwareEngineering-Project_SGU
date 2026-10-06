// src/hooks/useGeofence.js
//
// Automatic POI Audio Playback by GPS
// ====================================
// This hook handles the full GPS ↔ POI detection pipeline:
//
//  1. Fetch POI locations from backend  (GET /api/poi/locations)
//  2. Request browser Geolocation
//  3. watchPosition — track user GPS using navigator.geolocation.watchPosition
//  4. On each GPS update: calculate Haversine distance to every POI
//  5. Find nearest POI that is within its radius (OUTSIDE → INSIDE)
//  6. Trigger audio via audioService (only once per POI per session)
//  7. Cleanup watcher on unmount / disabled
//
// RULES enforced:
//  - No setInterval polling
//  - GPS is NOT sent to the backend
//  - Each POI triggers audio only once per session (playedPoiIds Set)
//  - If multiple POIs are in range, only the nearest triggers audio
//  - Audio conflict handled by usePlayer (queue + debounce)

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPoiLocations } from '../services/poiService';
import { calculateDistance, isInsidePoi } from '../utils/geo';
import { playPoiAudio } from '../services/audioService';

// GPS watchPosition options
const GEO_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 5000,   // accept cached positions up to 5 s old
  timeout: 10000,     // fail if no fix within 10 s
};

/**
 * usePoiLocation — GPS + POI detection + audio trigger hook.
 *
 * @param {object} params
 * @param {boolean}  params.enabled        Whether GPS tracking should be active
 * @param {string}   params.currentLang    Current UI language (VI|EN|ZH|JA|KO)
 * @param {Function} params.openPlayerFn   openPlayer function from usePlayer
 *
 * @returns {{
 *   pois:            Array,    // POI list from backend
 *   currentPosition: object|null,
 *   currentPoi:      object|null,
 *   currentDistance: number|null,
 *   isInsidePoi:     boolean,
 *   loading:         boolean,
 *   error:           string|null,
 *   gpsError:        string|null,
 * }}
 */
export function usePoiLocation({ enabled = true, currentLang = 'VI', openPlayerFn }) {
  const [pois, setPois] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentPoi, setCurrentPoi] = useState(null);
  const [currentDistance, setCurrentDistance] = useState(null);
  const [isInside, setIsInside] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  // Tracks which POI IDs have already played audio this session.
  // useRef — no re-render needed, persists across renders.
  const playedPoiIds = useRef(new Set());

  // watchPosition ID for cleanup
  const watchIdRef = useRef(null);

  // Keep a stable ref to the latest openPlayerFn so the watchPosition
  // callback doesn't stale-close over an old version.
  const openPlayerRef = useRef(openPlayerFn);
  useEffect(() => {
    openPlayerRef.current = openPlayerFn;
  }, [openPlayerFn]);

  // Keep stable ref to latest pois list
  const poisRef = useRef(pois);
  useEffect(() => {
    poisRef.current = pois;
  }, [pois]);

  // Keep stable ref to latest language
  const langRef = useRef(currentLang);
  useEffect(() => {
    langRef.current = currentLang;
  }, [currentLang]);

  // ----------------------------------------------------------------
  // Step 1: Fetch POI locations from backend (once when enabled)
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getPoiLocations()
      .then((data) => {
        if (cancelled) return;
        setPois(Array.isArray(data) ? data : []);
        console.log('[usePoiLocation] Fetched', data?.length, 'POIs from backend');
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[usePoiLocation] Failed to fetch POIs:', err.message);
        setError(err.message || 'Failed to load POI data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [enabled]);

  // ----------------------------------------------------------------
  // GPS position handler — called on every watchPosition update
  // ----------------------------------------------------------------
  const handlePosition = useCallback((position) => {
    const { latitude, longitude, accuracy } = position.coords;

    setCurrentPosition({ latitude, longitude, accuracy });
    setGpsError(null);

    const activePois = poisRef.current;
    if (!activePois || activePois.length === 0) return;

    // ---- Find nearest POI that is inside its radius ----
    let nearestPoi = null;
    let nearestDist = Infinity;

    for (const poi of activePois) {
      const { inside, distance } = isInsidePoi(latitude, longitude, poi, accuracy);

      if (inside && distance < nearestDist) {
        nearestPoi = poi;
        nearestDist = distance;
      }
    }

    // Debug log (development only)
    console.log('[GPS]', {
      latitude,
      longitude,
      accuracy,
      poi: nearestPoi?.name || null,
      distance: nearestDist === Infinity ? null : Math.round(nearestDist),
      inside: !!nearestPoi,
    });

    // ---- Update state ----
    setCurrentPoi(nearestPoi);
    setCurrentDistance(nearestPoi ? nearestDist : null);
    setIsInside(!!nearestPoi);

    // ---- Trigger audio (once per POI per session) ----
    if (nearestPoi) {
      const { id } = nearestPoi;

      if (!playedPoiIds.current.has(id)) {
        playedPoiIds.current.add(id);

        console.log('[usePoiLocation] OUTSIDE → INSIDE POI:', nearestPoi.name, `(${Math.round(nearestDist)}m)`);

        playPoiAudio(
          nearestPoi,
          langRef.current,
          openPlayerRef.current,
          { priority: 'high', force: false },
        );
      }
    }
  }, []); // stable — reads via refs

  // ----------------------------------------------------------------
  // GPS error handler
  // ----------------------------------------------------------------
  const handleGpsError = useCallback((err) => {
    let message;
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Quyền truy cập vị trí bị từ chối. Vui lòng cấp quyền GPS.';
        break;
      case err.POSITION_UNAVAILABLE:
        message = 'Không thể lấy vị trí. Thiết bị không có GPS hoặc tín hiệu yếu.';
        break;
      case err.TIMEOUT:
        message = 'Hết thời gian chờ GPS. Vui lòng thử lại.';
        break;
      default:
        message = `Lỗi GPS: ${err.message || 'Không xác định'}`;
    }
    console.warn('[usePoiLocation] GPS error:', message, err);
    setGpsError(message);
  }, []);

  // ----------------------------------------------------------------
  // Step 2+3: Start/stop watchPosition when enabled + pois ready
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!enabled) {
      // Cleanup any existing watcher when disabled
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Browser support check
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ GPS. Vui lòng dùng trình duyệt khác.');
      console.warn('[usePoiLocation] navigator.geolocation is not available');
      return;
    }

    // Don't start until we have POIs loaded
    if (pois.length === 0) return;

    // Clear any previous watcher before starting a new one
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    console.log('[usePoiLocation] Starting GPS watcher...');
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleGpsError,
      GEO_OPTIONS,
    );

    // Cleanup on unmount or when dependencies change
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        console.log('[usePoiLocation] GPS watcher cleared');
      }
    };
  }, [enabled, pois, handlePosition, handleGpsError]);

  return {
    pois,
    currentPosition,
    currentPoi,
    currentDistance,
    isInsidePoi: isInside,
    loading,
    error,
    gpsError,
  };
}

// ---------------------------------------------------------------------------
// Legacy export — kept for backward compatibility with existing App.jsx usage.
// App.jsx currently calls: useGeofence(POIS, 50, handleEnterPoi, enabled)
// After this refactor, App.jsx will use usePoiLocation instead.
// The function below is intentionally left as a thin stub that warns the dev.
// ---------------------------------------------------------------------------
export function useGeofence(pois, _radiusMeters, _onEnter, _enabled) {
  console.warn(
    '[useGeofence] Deprecated — use usePoiLocation from useGeofence.js instead.',
  );
}