// src/config/api.js
// Centralised API origin — services append their own /api paths.

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

function resolveApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    // Nếu truy cập từ IP mạng LAN (ví dụ 192.168.x.x trên điện thoại hoặc máy khác), gọi backend theo IP đó
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:9999`;
    }
  }
  return configuredBaseUrl || (import.meta.env.DEV ? 'http://localhost:9999' : '');
}

export const API_BASE_URL = resolveApiBaseUrl().replace(/\/+$/, '');
