// src/services/poiService.js
// Fetches POI location data from the backend with graceful local fallback.
//
// Backend endpoint: GET /api/poi/locations

import { API_BASE_URL } from '../config/api';
import { FALLBACK } from '../utils/constants';
import { POIS } from '../data/pois';

function unwrapList(payload) {
  const value = payload?.data ?? payload?.content ?? payload;
  return Array.isArray(value) ? value : [];
}

export function normalizePoi(poi) {
  const coordinate = value => value == null || value === '' ? NaN : Number(value);
  const lat = coordinate(poi.latitude ?? poi.lat);
  const lng = coordinate(poi.longitude ?? poi.lng);
  return {
    ...poi,
    id: poi.id,
    num: poi.num || String(poi.id).padStart(2, '0'),
    name: poi.name || '',
    desc: poi.desc || poi.originalDescription || poi.description || '',
    tag: poi.tag || poi.status || 'POI',
    latitude: lat,
    longitude: lng,
    lat: lat,
    lng: lng,
    radius: poi.radius == null || poi.radius === '' ? 50 : Number(poi.radius),
    addr: poi.addr || poi.address || '',
    directionLink: poi.directionLink || '',
    dist: poi.dist || '',
    hours: poi.hours || poi.openingHours || '',
    price: poi.price || poi.priceInfo || '',
    video: poi.video || null,
    imgs: Array.isArray(poi.imgs) && poi.imgs.length
      ? poi.imgs
      : Array.isArray(poi.images) && poi.images.length
        ? poi.images.map(image => new URL(image, `${API_BASE_URL || window.location.origin}/`).toString())
        : [FALLBACK],
    cat: poi.cat || null,
  };
}

/**
 * Fetch the list of POI locations from the backend.
 * Falls back to local POIS on network error / unauthorized so the UI never breaks.
 */
export async function getPoiLocations() {
<<<<<<< HEAD
  const { token } = readServiceAccess();
  const res = await fetch(`${API_BASE_URL}/api/poi/locations`, {
    headers: { Accept: 'application/json', 'X-Service-Token': token || '' },
  });
=======
  try {
    const res = await fetch(`${API_BASE_URL}/api/poi/locations`, {
      headers: { Accept: 'application/json' },
    });
>>>>>>> bbf2deb3dc305320a2bef2f510554f171ebccd01

    if (res.ok) {
      const data = await res.json();
      const list = unwrapList(data).filter(poi => poi?.id != null && typeof poi.name === 'string');
      if (list.length > 0) {
        return list.map(normalizePoi);
      }
    }
  } catch (err) {
    console.warn('[poiService] Could not reach backend /api/poi/locations, using local POIS cache:', err?.message || err);
  }

  // Graceful fallback: ALWAYS return local POIS dataset so user experience is smooth and uninterrupted
  return POIS.map(normalizePoi);
}
