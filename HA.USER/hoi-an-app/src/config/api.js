// src/config/api.js
// Centralised API base URL — reads from .env (VITE_API_BASE_URL)
// Backend is exposed by docker-compose on port 9999.

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = (configuredBaseUrl
  || (import.meta.env.DEV ? 'http://localhost:9999' : '')).replace(/\/+$/, '');
