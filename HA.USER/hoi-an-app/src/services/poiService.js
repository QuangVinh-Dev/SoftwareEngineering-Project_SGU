// src/services/poiService.js
// Fetches POI location data from the backend.
//
// Backend endpoint:  GET /api/poi/locations
// Response shape:
//   [
//     { id, name, latitude, longitude, radius },
//     ...
//   ]
//
// The project uses plain fetch (no Axios) — we keep that convention.

import { API_BASE_URL } from '../config/api';
import { FALLBACK } from '../utils/constants';

function unwrapList(payload) {
  const value = payload?.data ?? payload?.content ?? payload;
  return Array.isArray(value) ? value : [];
}

export function normalizePoi(poi) {
  const coordinate = value => value == null || value === '' ? NaN : Number(value);
  return {
    ...poi,
    id: poi.id,
    num: String(poi.id).padStart(2, '0'),
    name: poi.name || '',
    desc: poi.originalDescription || poi.description || '',
    tag: poi.status || 'POI',
    latitude: coordinate(poi.latitude),
    longitude: coordinate(poi.longitude),
    lat: coordinate(poi.latitude),
    lng: coordinate(poi.longitude),
    radius: poi.radius == null || poi.radius === '' ? NaN : Number(poi.radius),
    addr: '',
    directionLink: poi.directionLink || '',
    dist: '', hours: '', price: '', video: null,
    imgs: Array.isArray(poi.images) && poi.images.length
      ? poi.images.map(image => new URL(image, `${API_BASE_URL || window.location.origin}/`).toString())
      : [FALLBACK],
    cat: null,
  };
}

/**
 * Fetch the list of POI locations from the backend.
 *
 * @returns {Promise<Array<{ id: number, name: string, latitude: number, longitude: number, radius: number }>>}
 * @throws Will throw if the network request fails or the server returns a
 *         non-OK HTTP status.  Callers should catch and handle errors.
 */
export async function getPoiLocations() {
  const res = await fetch(`${API_BASE_URL}/api/poi/locations`, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    throw new Error(
      `[poiService] GET /api/poi/locations failed — HTTP ${res.status}`,
    );
  }

  const data = await res.json();
  return unwrapList(data).filter(poi => poi?.id != null && typeof poi.name === 'string')
    .map(normalizePoi);
}
