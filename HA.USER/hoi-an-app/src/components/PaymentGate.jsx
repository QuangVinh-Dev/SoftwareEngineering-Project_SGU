import { useCallback, useEffect, useRef, useState } from 'react';
import {
  claimPayment,
  clearPendingPayment,
  confirmVnPayReturn,
  createPayment,
  getPaymentStatus,
  readPendingPayment,
  savePendingPayment,
} from '../services/paymentService';

const PENDING_POLL_MS = 2500;

function formatMoney(value, currency = 'VND') {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Đang lấy từ máy chủ…';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
}

function safeVnPayUrl(value) {
  try {
    const url = new URL(value);
    const hostAllowed = url.hostname === 'pay.vnpay.vn'
      || url.hostname.endsWith('.vnpayment.vn');
    return url.protocol === 'https:' && hostAllowed ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function PaymentGate({ onUnlock, accessStatus = 'missing', accessError, onRetryAccess }) {
  const [phase, setPhase] = useState(accessStatus === 'checking' ? 'checking-access' : 'ready');
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [returnNotice, setReturnNotice] = useState('');
  const [gatewayReturnedFailure, setGatewayReturnedFailure] = useState(false);
  const pollInFlight = useRef(false);

  useEffect(() => {
    if (accessStatus === 'checking') setPhase('checking-access');
    else if (accessStatus === 'unavailable') setPhase('access-error');
    else if (phase === 'checking-access' || phase === 'access-error') setPhase('ready');
  }, [accessStatus, phase]);

  const finishPaidPayment = useCallback(async (current) => {
    const target = current || readPendingPayment();
    if (!target?.claimSecret || !target?.txnRef) {
      console.warn('[PaymentGate] finishPaidPayment missing target or claimSecret:', target);
      return;
    }
    if (pollInFlight.current) return;
    pollInFlight.current = true;
    setPhase('claiming');
    setError('');

    try {
      console.log('[PaymentGate] Claiming access token for txn:', target.txnRef);
      const claimed = await claimPayment(target.claimSecret);
      if (!claimed.accessToken) throw new Error('Backend chưa trả access token dịch vụ.');

      console.log('[PaymentGate] Activating unlocked tour with token...');
      const activated = await onUnlock(claimed.accessToken, target.txnRef);
      if (!activated) throw new Error('Thanh toán đã xác nhận nhưng chưa thể xác minh quyền sử dụng. Hãy thử tải lại trạng thái.');

      clearPendingPayment();
      setPhase('success');
      console.log('[PaymentGate] Tour unlocked successfully!');
    } catch (claimError) {
      console.error('[PaymentGate] Error in finishPaidPayment:', claimError);
      setError(claimError.message || 'Chưa thể nhận quyền sử dụng.');
      setPhase('pending');
    } finally {
      pollInFlight.current = false;
    }
  }, [onUnlock]);

  useEffect(() => {
    if (accessStatus === 'checking' || accessStatus === 'unavailable') return;
    const pending = readPendingPayment();
    const query = new URLSearchParams(window.location.search);
    const returnedTxn = query.get('vnp_TxnRef');
    const responseCode = query.get('vnp_ResponseCode');

    if (!pending && !returnedTxn) return;

    if (pending) {
      setPayment({ ...pending, paymentUrl: null, amount: null, currency: 'VND' });
      setPhase('pending');
    }

    if (returnedTxn) {
      if (responseCode && responseCode !== '00') {
        setGatewayReturnedFailure(true);
        setReturnNotice('VNPay trả về kết quả không thành công.');
      } else {
        setReturnNotice('Đã quay lại từ VNPay. Hệ thống đang xác minh giao dịch...');
      }

      const returnParams = {};
      query.forEach((value, key) => {
        if (key.startsWith('vnp_')) returnParams[key] = value;
      });

      // Xóa query param trên thanh URL để nhìn gọn gàng
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);

      confirmVnPayReturn(returnParams).then(async (result) => {
        console.log('[PaymentGate] VNPay return verification result:', result);
        if (!result.verified) {
          setError(result.message || 'Backend không xác minh được kết quả VNPay trả về.');
        } else if (result.status === 'PAID') {
          setReturnNotice('Backend đã xác minh giao dịch thành công. Đang kích hoạt quyền sử dụng...');
          await finishPaidPayment(pending || { txnRef: returnedTxn, claimSecret: pending?.claimSecret });
        } else if (result.status === 'FAILED') {
          setReturnNotice('Backend đã xác minh giao dịch không thành công.');
        }
      }).catch((returnError) => {
        console.error('[PaymentGate] confirmVnPayReturn error:', returnError);
        setError(returnError.message || 'Không thể gửi kết quả VNPay về Backend để xác minh.');
      });
    }
  }, [accessStatus, finishPaidPayment]);

  useEffect(() => {
    if (phase !== 'pending' || !payment?.txnRef || !payment?.claimSecret) return undefined;
    let stopped = false;
    const checkStatus = async () => {
      if (pollInFlight.current || stopped) return;
      pollInFlight.current = true;
      try {
        const status = await getPaymentStatus(payment.txnRef, { claimSecret: payment.claimSecret });
        if (stopped) return;
        setPayment((current) => ({
          ...current,
          amount: status.amount,
          currency: status.currency || 'VND',
          status: status.status,
        }));
        if (status.status === 'PAID') {
          pollInFlight.current = false;
          await finishPaidPayment(payment);
          return;
        }
        if (status.status === 'FAILED') {
          clearPendingPayment();
          setPhase('failed');
          setError('VNPay đã xác nhận giao dịch thất bại hoặc bị hủy.');
        }
      } catch (statusError) {
        if (!stopped) setError(statusError.message || 'Không thể kiểm tra trạng thái giao dịch.');
      } finally {
        pollInFlight.current = false;
      }
    };

    checkStatus();
    const timer = window.setInterval(checkStatus, PENDING_POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [finishPaidPayment, payment?.txnRef, payment?.claimSecret, phase]);

  const startPayment = async () => {
    setPhase('creating');
    setError('');
    setReturnNotice('');
    setGatewayReturnedFailure(false);
    try {
      const created = await createPayment();
      if (!created.txnRef || !created.claimSecret) {
        throw new Error('Backend không trả đủ thông tin giao dịch.');
      }
      const next = {
        txnRef: created.txnRef,
        claimSecret: created.claimSecret,
        createdAt: Date.now(),
        paymentUrl: safeVnPayUrl(created.paymentUrl),
        amount: null,
        currency: 'VND',
      };
      savePendingPayment({ txnRef: next.txnRef, claimSecret: next.claimSecret, createdAt: next.createdAt });
      setPayment(next);
      setPhase('pending');

      if (next.paymentUrl) {
        // Tự động chuyển hướng sang cổng VNPay ngay lập tức
        window.location.href = next.paymentUrl;
      } else {
        setError('Backend trả về URL thanh toán không hợp lệ.');
      }
    } catch (createError) {
      setPhase('error');
      setError(createError.message || 'Không thể khởi tạo giao dịch.');
    }
  };

  const retryPayment = () => {
    clearPendingPayment();
    setPayment(null);
    setError('');
    setReturnNotice('');
    setGatewayReturnedFailure(false);
    setPhase('ready');
  };

  const checkingAccess = phase === 'checking-access';
  const unavailable = phase === 'access-error';
  const waiting = phase === 'pending' || phase === 'claiming';

  return (
    <main className="pg">
      <section className="pg__card" aria-live="polite">
        <header className="pg__head">
          <h1 className="pg__title">Hội An</h1>
          <p className="pg__subtitle">Di sản &amp; Ẩm thực</p>
        </header>

        {checkingAccess ? (
          <>
            <h2 className="pg__section-title">Đang xác minh quyền sử dụng</h2>
            <p className="pg__message">Đang kiểm tra trạng thái dịch vụ với máy chủ…</p>
          </>
        ) : unavailable ? (
          <>
            <h2 className="pg__section-title">Chưa thể xác minh quyền</h2>
            <p className="pg__message pg__message--error">{accessError || 'Máy chủ tạm thời không thể kiểm tra quyền sử dụng.'}</p>
            <button type="button" className="pg__btn" onClick={onRetryAccess}>Thử kiểm tra lại</button>
          </>
        ) : phase === 'success' ? (
          <>
            <h2 className="pg__section-title">Thanh toán thành công</h2>
            <p className="pg__message">Đã kích hoạt quyền sử dụng. Đang chuyển vào trang chủ…</p>
          </>
        ) : (
          <>
            <div className="pg__intro">
              <h2 className="pg__section-title">Mở khóa thuyết minh Hội An</h2>
              <p className="pg__intro-text">
                Truy cập bản đồ, các điểm tham quan và thuyết minh đa ngôn ngữ trong thời hạn do hệ thống cấp.
                Số tiền được lấy từ cấu hình Backend khi tạo giao dịch.
              </p>
            </div>

            {payment && (
              <div className="pg__info" aria-label="Thông tin giao dịch">
                <div className="pg__info-row"><span>Số tiền</span><strong>{formatMoney(payment.amount, payment.currency)}</strong></div>
                <div className="pg__info-row"><span>Mã giao dịch</span><strong>{payment.txnRef}</strong></div>
                <div className="pg__info-row"><span>Trạng thái</span><strong>{payment.status === 'FAILED' ? 'Thất bại' : payment.status === 'PAID' ? 'Đã xác nhận' : 'Đang chờ xác nhận'}</strong></div>
              </div>
            )}

            {waiting && (
              <div className="pg__payment-state" role="status">
                <span className="pg__spinner" aria-hidden="true" />
                <div>
                  <strong>{phase === 'claiming' ? 'Đang kích hoạt quyền sử dụng' : 'Đang xử lý với cổng VNPay'}</strong>
                  <p>{returnNotice || 'Trạng thái được xác minh tự động với Backend. Vui lòng không đóng trang.'}</p>
                </div>
              </div>
            )}

            {error && <p className="pg__error" role="alert">{error}</p>}

            <div className="pg__actions">
              {phase === 'ready' && (
                <button type="button" className="pg__btn" onClick={startPayment}>
                  Bắt đầu thanh toán
                </button>
              )}
              {phase === 'creating' && (
                <button type="button" className="pg__btn" disabled>Đang chuyển hướng sang VNPay…</button>
              )}
              {phase === 'error' && (
                <button type="button" className="pg__btn" onClick={startPayment}>Thử tạo giao dịch lại</button>
              )}
              {phase === 'pending' && payment?.paymentUrl && (
                <a className="pg__btn pg__btn--link" href={payment.paymentUrl}>Tiếp tục tại cổng VNPay</a>
              )}
              {phase === 'failed' && (
                <button type="button" className="pg__secondary-btn" onClick={retryPayment}>Thử thanh toán lại</button>
              )}
            </div>

            <ol className="pg__steps">
              <li>Bấm nút bắt đầu để chuyển sang cổng VNPay Sandbox.</li>
              <li>Nhập thông tin thẻ test và hoàn tất thanh toán.</li>
              <li>Hệ thống tự động kích hoạt và mở khóa bản đồ di tích ngay lập tức.</li>
            </ol>
          </>
        )}

        <footer className="pg__foot">
          <p>Quyền chỉ được kích hoạt sau khi Backend xác nhận kết quả VNPay.</p>
        </footer>
      </section>
    </main>
  );
}
