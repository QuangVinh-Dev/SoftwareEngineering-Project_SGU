import { API_BASE_URL } from '../config/api';

const PENDING_KEY = 'hoian_pending_payment';
const ACCESS_TOKEN_KEY = 'hoian_service_access_token';
const ACCESS_TXN_KEY = 'hoian_service_access_txn';

async function readResponse(response) {
  let payload = {};
  try { payload = await response.json(); } catch { /* empty or non-JSON error */ }
  if (!response.ok) {
    const error = new Error(payload.message || `Yêu cầu thất bại (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function createPayment() {
  const response = await fetch(`${API_BASE_URL}/api/payments`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  return readResponse(response);
}

export async function getPaymentStatus(txnRef, { claimSecret, serviceToken, signal } = {}) {
  if (!claimSecret && !serviceToken) throw new Error('Thiếu thông tin xác minh giao dịch.');
  const headers = { Accept: 'application/json' };
  if (claimSecret) headers['X-Payment-Claim-Secret'] = claimSecret;
  if (serviceToken) headers['X-Service-Token'] = serviceToken;
  const response = await fetch(`${API_BASE_URL}/api/payments/${encodeURIComponent(txnRef)}/status`, {
    credentials: 'include',
    headers,
    signal,
  });
  return readResponse(response);
}

export async function claimPayment(claimSecret) {
  const response = await fetch(`${API_BASE_URL}/api/payments/claim`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimSecret }),
  });
  return readResponse(response);
}

export async function confirmVnPayReturn(params) {
  const response = await fetch(`${API_BASE_URL}/api/payments/vnpay/return`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return readResponse(response);
}

export function readPendingPayment() {
  try {
    const value = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
    return value?.txnRef && value?.claimSecret ? value : null;
  } catch {
    return null;
  }
}

export function savePendingPayment(payment) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(payment));
}

export function clearPendingPayment() {
  sessionStorage.removeItem(PENDING_KEY);
}

export function readServiceAccess() {
  return {
    token: sessionStorage.getItem(ACCESS_TOKEN_KEY),
    txnRef: sessionStorage.getItem(ACCESS_TXN_KEY),
  };
}

export function saveServiceAccess(token, txnRef) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  sessionStorage.setItem(ACCESS_TXN_KEY, txnRef);
}

export function clearServiceAccess() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TXN_KEY);
}
