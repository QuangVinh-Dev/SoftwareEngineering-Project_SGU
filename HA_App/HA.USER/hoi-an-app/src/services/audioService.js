// src/services/audioService.js
// Audio service — resolves and plays POI audio by language.
//
// Architecture:
//   GPS logic → audioService.playPoiAudio(poi, language, openPlayerFn)
//               ↓
//               resolves audio text / URL
//               ↓
//               calls openPlayerFn (from usePlayer hook)
//
// The GPS/geofence hook never builds audio URLs itself.
// If the backend later exposes an audio API, only this file needs updating.
//
// Current implementation:  uses the existing Web Speech API (TTS) player
// that is already wired into the app via usePlayer.  The player receives:
//   - name:       POI display name (used as title)
//   - langCode:   language key (VI | EN | ZH | JA | KO)
//   - poiId:      POI id
//   - speechText: text to be spoken
//
// When a real audio file API is available, replace the body of
// resolveAudioForPoi() to fetch the URL, then play an HTMLAudioElement
// instead of calling the TTS player.

/**
 * Build the speech text that will be sent to Web Speech API.
 * Keeps it short: POI name + first sentence of description.
 *
 * @param {string} name
 * @param {string} [desc]
 * @returns {string}
 */
function buildSpeechText(name, desc) {
  const cleanName = (name || '').trim();
  const cleanDesc = (desc || '').trim();

  if (!cleanDesc) return cleanName;

  // Take first sentence only (split on sentence-ending punctuation)
  const firstSentence = cleanDesc.split(/(?<=[.!?])\s+/)[0] || cleanDesc;
  const shortDesc =
    firstSentence.length > 150
      ? firstSentence.slice(0, 147).trim() + '...'
      : firstSentence;

  return `${cleanName}. ${shortDesc}`;
}

/**
 * Play the audio commentary for a POI in the selected language.
 *
 * This function is deliberately thin: it delegates the actual TTS call to the
 * openPlayerFn provided by the usePlayer hook.  Keeping audio resolution here
 * (rather than in the GPS hook) means we can swap the implementation later
 * (e.g. fetch a real MP3 URL from the backend) without touching GPS logic.
 *
 * @param {{ id: number, name: string, [key: string]: any }} poi
 *   The POI object.  When using backend POI locations the object will have
 *   { id, name, latitude, longitude, radius }.  When enriched with local
 *   POIS data it may also have { desc, ... }.
 * @param {string} language
 *   Language key: 'VI' | 'EN' | 'ZH' | 'JA' | 'KO'
 * @param {Function} openPlayerFn
 *   The openPlayer function from usePlayer hook.
 *   Signature: openPlayer(name, langCode, poiId, speechText, options)
 * @param {object} [options]
 *   Options forwarded to openPlayerFn (e.g. { priority, force })
 */
export function playPoiAudio(poi, language, openPlayerFn, options = {}) {
  if (!poi || !openPlayerFn) return;

  const lang = (language || 'VI').toUpperCase();
  const name = poi.name || '';
  // desc may exist if the poi object was enriched from local POIS data
  const desc = poi.desc || '';
  const speechText = buildSpeechText(name, desc);

  const { priority = 'high', force = false } = options;

  openPlayerFn(name, lang, poi.id, speechText, { priority, force });
}
