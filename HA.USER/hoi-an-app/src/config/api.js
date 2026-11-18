// Centralised API origin — services append their own /api paths.

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

function resolveApiBaseUrl() {
  // Development uses the Vite proxy.
  if (import.meta.env.DEV) {
    return '';
  }

  // Production uses the backend domain configured at build time.
  if (!configuredBaseUrl) {
    throw new Error('Missing VITE_API_BASE_URL in production build');
  }

  return configuredBaseUrl;
}

export const API_BASE_URL = resolveApiBaseUrl().replace(/\/+$/, '');
