// src/config/api.js
// Centralised API origin — services append their own /api paths.

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

function resolveApiBaseUrl() {
  // Khi chạy trên trình duyệt (kể cả máy tính hay điện thoại qua mạng LAN):
  // Dùng relative path '' để mọi request đi qua chính port của web (5173),
  // qua Vite proxy chuyển tiếp về backend 9999 ngầm.
  // Nhờ đó điện thoại không bao giờ bị tường lửa Windows chặn cổng 9999.
  if (typeof window !== 'undefined' && window.location) {
    return '';
  }
  return configuredBaseUrl || (import.meta.env.DEV ? 'http://localhost:9999' : '');
}

export const API_BASE_URL = resolveApiBaseUrl().replace(/\/+$/, '');
