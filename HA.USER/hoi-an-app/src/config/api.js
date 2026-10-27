// src/config/api.js
// Centralised API origin — services append their own /api paths.
// Vite injects VITE_API_BASE_URL at build time. Production intentionally falls
// back to same-origin so a localhost development URL is never baked into dist.

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = (configuredBaseUrl
  || (import.meta.env.DEV ? 'http://localhost:9999' : '')).replace(/\/+$/, '');
