import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistance, isInsidePoi, nearestPoiInRange } from '../geo.js';

const origin = { latitude: 15.88, longitude: 108.33, radius: 50 };
const eastAt = (meters) => ({ ...origin, longitude: origin.longitude + meters / (111320 * Math.cos(origin.latitude * Math.PI / 180)) });

test('same coordinate is exactly zero metres', () => {
  assert.equal(calculateDistance(origin.latitude, origin.longitude, origin.latitude, origin.longitude), 0);
});

test('inclusive radius boundary and outside boundary', () => {
  const boundary = eastAt(50);
  const distance = calculateDistance(origin.latitude, origin.longitude, boundary.latitude, boundary.longitude);
  assert.ok(Math.abs(distance - 50) < 0.2);
  assert.equal(isInsidePoi(origin.latitude, origin.longitude, { ...boundary, radius: distance }).inside, true);
  assert.equal(isInsidePoi(origin.latitude, origin.longitude, { ...boundary, radius: distance - 0.01 }).inside, false);
});

test('chooses closest among in-range POIs, ignoring a closer POI outside its own radius', () => {
  const outsideCloser = { id: 1, ...eastAt(20), radius: 5 };
  const insideFarther = { id: 2, ...eastAt(30), radius: 50 };
  const otherInside = { id: 3, ...eastAt(40), radius: 50 };
  assert.equal(nearestPoiInRange(origin.latitude, origin.longitude, [outsideCloser, insideFarther, otherInside]).poi.id, 2);
});

test('returns no POI when none qualifies and rejects malformed locations', () => {
  assert.equal(nearestPoiInRange(origin.latitude, origin.longitude, [{ ...eastAt(20), radius: 1 }]), null);
  assert.ok(Number.isNaN(calculateDistance(91, 0, 0, 0)));
  assert.equal(isInsidePoi(origin.latitude, origin.longitude, { latitude: 'bad', longitude: 0, radius: 20 }).inside, false);
  assert.equal(isInsidePoi(origin.latitude, origin.longitude, { latitude: null, longitude: 0, radius: 20 }).inside, false);
});

test('ignores fixes with poor GPS accuracy', () => {
  assert.equal(isInsidePoi(origin.latitude, origin.longitude, origin, 101).inside, false);
});
