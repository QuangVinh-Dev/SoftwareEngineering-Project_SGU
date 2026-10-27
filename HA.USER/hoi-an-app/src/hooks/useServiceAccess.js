import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearServiceAccess,
  getPaymentStatus,
  readServiceAccess,
  saveServiceAccess,
} from '../services/paymentService';

function initialAccessState() {
  const saved = readServiceAccess();
  return {
    status: saved.token && saved.txnRef ? 'checking' : 'missing',
    expiresAt: null,
    secondsRemaining: null,
    error: null,
  };
}

export function useServiceAccess() {
  const [access, setAccess] = useState(initialAccessState);
  const [justActivated, setJustActivated] = useState(false);
  const deadlineRef = useRef(null);

  const refresh = useCallback(async () => {
    const { token, txnRef } = readServiceAccess();
    if (!token || !txnRef) {
      deadlineRef.current = null;
      setAccess({ status: 'missing', expiresAt: null, secondsRemaining: null, error: null });
      return false;
    }

    try {
      const payment = await getPaymentStatus(txnRef, { serviceToken: token });
      if (payment.status !== 'PAID' || !payment.accessExpiresAt
        || !Number.isFinite(Number(payment.secondsRemaining))) {
        clearServiceAccess();
        deadlineRef.current = null;
        setAccess({ status: 'expired', expiresAt: null, secondsRemaining: 0, error: null });
        return false;
      }

      const secondsRemaining = Math.max(0, Number(payment.secondsRemaining));
      deadlineRef.current = performance.now() + secondsRemaining * 1000;
      if (secondsRemaining <= 0) {
        clearServiceAccess();
        setAccess({ status: 'expired', expiresAt: payment.accessExpiresAt, secondsRemaining: 0, error: null });
        return false;
      }
      setAccess({
        status: 'active',
        expiresAt: payment.accessExpiresAt,
        secondsRemaining,
        error: null,
      });
      return true;
    } catch (error) {
      deadlineRef.current = null;
      if (error.status === 401 || error.status === 404) {
        clearServiceAccess();
        setAccess({ status: 'expired', expiresAt: null, secondsRemaining: 0, error: null });
      } else {
        setAccess({
          status: 'unavailable',
          expiresAt: null,
          secondsRemaining: null,
          error: error.message || 'Không thể xác minh quyền sử dụng.',
        });
      }
      return false;
    }
  }, []);

  const activate = useCallback(async (token, txnRef) => {
    if (!token || !txnRef) return false;
    saveServiceAccess(token, txnRef);
    const active = await refresh();
    if (active) {
      setJustActivated(true);
      window.setTimeout(() => setJustActivated(false), 8000);
    }
    return active;
  }, [refresh]);

  useEffect(() => {
    refresh();
    const tick = () => {
      if (deadlineRef.current == null) return;
      const secondsRemaining = Math.max(0, Math.ceil((deadlineRef.current - performance.now()) / 1000));
      if (secondsRemaining === 0) {
        clearServiceAccess();
        deadlineRef.current = null;
        setAccess((current) => ({ ...current, status: 'expired', secondsRemaining: 0 }));
        return;
      }
      setAccess((current) => current.status === 'active'
        ? { ...current, secondsRemaining }
        : current);
    };
    const ticker = window.setInterval(tick, 1000);
    const verifier = window.setInterval(refresh, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(ticker);
      window.clearInterval(verifier);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  return { ...access, justActivated, refresh, activate };
}
