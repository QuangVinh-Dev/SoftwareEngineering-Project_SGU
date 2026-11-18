import { API_BASE_URL } from '../config/api';

const VISITOR_ID_KEY = 'hoian_device_persistent_id';

function getOrCreateDeviceId() {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

export function startVisitorTracking() {
  const deviceId = getOrCreateDeviceId();

  const sendHeartbeat = () => {
    fetch(`${API_BASE_URL}/api/public/visitor/heartbeat?deviceId=${encodeURIComponent(deviceId)}`, {
      method: 'POST',
      credentials: 'omit',
    }).catch(() => {});
  };

  const sendLeave = () => {
    const url = `${API_BASE_URL}/api/public/visitor/leave?deviceId=${encodeURIComponent(deviceId)}`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: 'POST', keepalive: true, credentials: 'omit' }).catch(() => {});
    }
  };

  // 1. Gửi heartbeat ngay khi du khách vào trang
  sendHeartbeat();

  // 2. Gửi định kỳ mỗi 8 giây để giữ trạng thái trực tuyến
  const intervalId = window.setInterval(sendHeartbeat, 8000);

  // 3. Gửi tín hiệu thoát ngay khi đóng tab / thoát trình duyệt
  window.addEventListener('pagehide', sendLeave);
  window.addEventListener('beforeunload', sendLeave);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener('pagehide', sendLeave);
    window.removeEventListener('beforeunload', sendLeave);
    sendLeave();
  };
}
