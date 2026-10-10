import { API_BASE_URL } from '../config/api';

const LANGUAGE_CODES = { VI: 'vi', EN: 'en', ZH: 'zh', JA: 'ja', KO: 'ko' };

export async function getPoiAudio(poiId, language) {
  const languageCode = LANGUAGE_CODES[String(language || 'VI').toUpperCase()] || String(language).toLowerCase();
  const response = await fetch(
    `${API_BASE_URL}/api/poi/${encodeURIComponent(poiId)}/audio?languageCode=${encodeURIComponent(languageCode)}`,
  );
  // The backend uses 404 when a valid POI has no translation for a language.
  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`Audio API failed (HTTP ${response.status})`);
  }
  const records = await response.json();
  return Array.isArray(records) ? records : [];
}

export function resolveAudioUrl(filePath) {
  if (!filePath) return null;
  return new URL(filePath, `${API_BASE_URL}/`).toString();
}

export async function playPoiAudio(poi, language, openPlayerFn, isCurrent = () => true) {
  if (!poi || !openPlayerFn) return;
  const lang = String(language || 'VI').toUpperCase();
  try {
    const audios = await getPoiAudio(poi.id, lang);
    if (!isCurrent()) return;
    const audio = audios[0];
    if (!audio) {
      openPlayerFn(poi.name, lang, poi.id, null, { empty: true });
      return;
    }
    openPlayerFn(poi.name, lang, poi.id, resolveAudioUrl(audio.filePath), {
      languageName: audio.languageName,
      voiceName: audio.voiceName,
      durationSeconds: audio.durationSeconds,
    });
  } catch (error) {
    if (!isCurrent()) return;
    console.warn('[audioService] Unable to load POI audio:', error);
    openPlayerFn(poi.name, lang, poi.id, null, { error: error.message });
  }
}
