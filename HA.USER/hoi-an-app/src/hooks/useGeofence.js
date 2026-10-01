// src/hooks/useGeofence.js
import { useEffect, useRef } from 'react';

/* Haversine — tính khoảng cách (mét) giữa 2 tọa độ */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Theo dõi vị trí user, phát hiện khi vào bán kính quanh POI.
 */
export function useGeofence(pois, radiusMeters = 50, onEnter, enabled = true) {
  const lastTriggerRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) return;

    const handlePosition = (pos) => {
      const { latitude, longitude } = pos.coords;

      let nearest = null;
      let nearestDist = Infinity;

      pois.forEach((p) => {
        const d = distanceMeters(latitude, longitude, p.lat, p.lng);
        if (d < radiusMeters && d < nearestDist) {
          nearest = p;
          nearestDist = d;
        }
      });

      if (nearest && nearest.id !== lastTriggerRef.current) {
        lastTriggerRef.current = nearest.id;
        onEnter?.(nearest, nearestDist);
      }

      if (!nearest) {
        lastTriggerRef.current = null;
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => console.warn('[Geofence] Lỗi GPS:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [pois, radiusMeters, onEnter, enabled]);
}