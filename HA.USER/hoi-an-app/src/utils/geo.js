// src/utils/geo.js
// Haversine formula — calculates the great-circle distance between two
// GPS coordinates.  Returns the result in **metres**.
//
// Usage:
//   const dist = calculateDistance(userLat, userLng, poiLat, poiLng);
//   if (dist <= poi.radius) { /* inside POI */ }
//
// DO NOT use simple Euclidean distance (sqrt of squared lat/lng differences)
// because 1 degree of latitude ≠ 1 degree of longitude in metres.

const EARTH_RADIUS_METERS = 6_371_000; // mean radius of Earth

/**
 * Convert degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate the Haversine distance between two GPS points.
 *
 * @param {number} lat1  Latitude of point A  (degrees)
 * @param {number} lng1  Longitude of point A (degrees)
 * @param {number} lat2  Latitude of point B  (degrees)
 * @param {number} lng2  Longitude of point B (degrees)
 * @returns {number} Distance in metres
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

/**
 * Determine whether the user is inside a POI's radius.
 *
 * @param {number} userLat
 * @param {number} userLng
 * @param {{ latitude: number, longitude: number, radius: number }} poi
 * @param {number} [accuracyMeters]  Optional GPS accuracy — reserved for
 *   future use (e.g. accuracy <= allowedAccuracy guard).
 * @returns {{ inside: boolean, distance: number }}
 */
export function isInsidePoi(userLat, userLng, poi, accuracyMeters) {
  const distance = calculateDistance(
    userLat,
    userLng,
    poi.latitude,
    poi.longitude,
  );

  // Future extension: add accuracy guard here
  // e.g. if (accuracyMeters != null && accuracyMeters > MAX_ACCURACY) return { inside: false, distance };

  return { inside: distance <= poi.radius, distance };
}
