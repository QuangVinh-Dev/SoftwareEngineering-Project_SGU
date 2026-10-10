// src/config/api.js
// Centralised API base URL — reads from .env (VITE_API_BASE_URL)
// Backend is exposed by docker-compose on port 9999.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999';
