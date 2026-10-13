import { apiRequest, API_BASE_URL } from '@/services/authApi';

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'Tiếng Anh' },
  { code: 'ja', name: 'Tiếng Nhật' },
  { code: 'ko', name: 'Tiếng Hàn' },
  { code: 'zh', name: 'Tiếng Trung' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export interface PoiLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface AdminPoi extends PoiLocation {
  priorityLevel: number;
  originalDescription: string | null;
  directionLink: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
}

export type PoiMutation = Omit<AdminPoi, 'id'>;

export interface PoiLanguageContent {
  code: string;
  name: string;
  active: boolean;
  content: string | null;
  status: 'APPROVED' | 'PENDING' | string | null;
  audioUrl: string | null;
  durationSeconds: number | null;
}

export interface PoiContent {
  poiId: number;
  name: string;
  originalDescription: string | null;
  languages: PoiLanguageContent[];
}

export interface TranslationPreview {
  success: boolean;
  translatedText: string | null;
  error: string | null;
}

export interface TranslationPreviewResponse {
  translations: Partial<Record<LanguageCode, TranslationPreview>>;
}

export interface SavedTranslation {
  id: number;
  languageCode: string;
  translatedText: string;
  status: string;
}

export interface AudioGenerationResult {
  languageCode: string;
  success: boolean;
  audioId: number | null;
  audioUrl: string | null;
  durationSeconds: number | null;
  message: string;
}

export interface PoiAudio {
  id: number;
  languageCode: string;
  languageName: string;
  filePath: string;
  durationSeconds: number | null;
  voiceName: string;
}

export function getPoiLocations() {
  return apiRequest<PoiLocation[]>('/api/poi/locations');
}

export function getAdminPois() {
  return apiRequest<AdminPoi[]>('/api/admin/pois');
}

export function createPoi(poi: PoiMutation) {
  return apiRequest<AdminPoi>('/api/admin/pois', { method: 'POST', body: JSON.stringify(poi) });
}

export function updatePoi(id: number, poi: PoiMutation) {
  return apiRequest<AdminPoi>(`/api/admin/pois/${id}`, { method: 'PUT', body: JSON.stringify(poi) });
}

export function getPoiContent(poiId: number) {
  return apiRequest<PoiContent>(`/api/admin/pois/${poiId}/content`);
}

export function previewTranslations(poiId: number, sourceText: string, targetLanguages: LanguageCode[]) {
  return apiRequest<TranslationPreviewResponse>(`/api/admin/pois/${poiId}/translations/preview`, {
    method: 'POST', body: JSON.stringify({ sourceText, targetLanguages }),
  });
}

export function saveTranslation(poiId: number, languageCode: LanguageCode, translatedText: string) {
  return apiRequest<SavedTranslation>(`/api/admin/pois/${poiId}/translations/${languageCode}`, {
    method: 'PUT', body: JSON.stringify({ translatedText }),
  });
}

export function approveTranslation(poiId: number, languageCode: LanguageCode) {
  return apiRequest<SavedTranslation>(`/api/admin/pois/${poiId}/translations/${languageCode}/approve`, {
    method: 'POST',
  });
}

export function generatePoiAudio(poiId: number, languageCodes: LanguageCode[]) {
  return apiRequest<AudioGenerationResult[]>(`/api/admin/pois/${poiId}/audio/generate`, {
    method: 'POST', body: JSON.stringify({ languageCodes }),
  });
}

export function getPoiAudios(poiId: number, languageCode: LanguageCode) {
  return apiRequest<PoiAudio[]>(`/api/poi/${poiId}/audio?languageCode=${encodeURIComponent(languageCode)}`);
}

export function resolveAudioUrl(filePath: string | null) {
  return filePath ? new URL(filePath, API_BASE_URL ? `${API_BASE_URL}/` : `${window.location.origin}/`).toString() : null;
}
