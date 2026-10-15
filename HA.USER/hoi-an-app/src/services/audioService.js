import { API_BASE_URL } from '../config/api';

const LANGUAGE_CODES = { VI: 'vi', EN: 'en', ZH: 'zh', JA: 'ja', KO: 'ko' };

export async function getPoiAudio(poiId, language, { signal } = {}) {
  const languageCode = LANGUAGE_CODES[String(language || 'VI').toUpperCase()] || String(language).toLowerCase();
  const response = await fetch(
    `${API_BASE_URL}/api/poi/${encodeURIComponent(poiId)}/audio?languageCode=${encodeURIComponent(languageCode)}`,
    { signal, headers: { Accept: 'application/json' } },
  );
  // The backend uses 404 when a valid POI has no translation for a language.
  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`Audio API failed (HTTP ${response.status})`);
  }
  const payload = await response.json();
  const records = payload?.data ?? payload;
  return Array.isArray(records) ? records : [];
}

export function resolveAudioUrl(filePath) {
  if (!filePath) return null;
  const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  return new URL(filePath, `${baseUrl}/`).toString();
}

export async function playPoiAudio(poi, language, openPlayerFn, isCurrent = () => true, { signal } = {}) {
  if (!poi || !openPlayerFn) return;
  const lang = String(language || 'VI').toUpperCase();
  try {
    const audios = await getPoiAudio(poi.id, lang, { signal });
    if (!isCurrent()) return;
    const requestedCode = LANGUAGE_CODES[lang] || lang.toLowerCase();
    const audio = audios.find((item) => item.languageCode?.toLowerCase() === requestedCode
      && typeof item.filePath === 'string' && item.filePath.trim());
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
    if (error?.name === 'AbortError') return;
    if (!isCurrent()) return;
    console.warn('[audioService] Unable to load POI audio:', error);
    openPlayerFn(poi.name, lang, poi.id, null, { error: error.message });
  }
}
