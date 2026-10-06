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

/**
 * Fetch the list of POI locations from the backend.
 *
 * @returns {Promise<Array<{ id: number, name: string, latitude: number, longitude: number, radius: number }>>}
 * @throws Will throw if the network request fails or the server returns a
 *         non-OK HTTP status.  Callers should catch and handle errors.
 */
export async function getPoiLocations() {
  const res = await fetch(`${API_BASE_URL}/api/poi/locations`);

  if (!res.ok) {
    throw new Error(
      `[poiService] GET /api/poi/locations failed — HTTP ${res.status}`,
    );
  }

  const data = await res.json();
  return data; // Array of { id, name, latitude, longitude, radius }
}
