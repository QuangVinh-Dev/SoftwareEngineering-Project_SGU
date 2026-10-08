// src/config/api.js
// Centralised API base URL — reads from .env (VITE_API_BASE_URL)
// Falls back to localhost:8888 if env var is not set.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888';
