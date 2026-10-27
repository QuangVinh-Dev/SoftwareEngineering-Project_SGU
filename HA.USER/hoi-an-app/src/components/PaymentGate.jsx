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

const PENDING_POLL_MS = 3000;

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

  useEffect(() => {
    if (accessStatus === 'checking' || accessStatus === 'unavailable') return;
    const pending = readPendingPayment();
    if (!pending) return;

    setPayment({ ...pending, paymentUrl: null, amount: null, currency: 'VND' });
    setPhase('pending');
    const query = new URLSearchParams(window.location.search);
    const returnedTxn = query.get('vnp_TxnRef');
    const responseCode = query.get('vnp_ResponseCode');
    if (responseCode && responseCode !== '00') {
      setGatewayReturnedFailure(true);
      setReturnNotice('VNPay trả về kết quả không thành công. Đang chờ Backend xác nhận trạng thái cuối cùng.');
    }
    if (returnedTxn) {
      if (returnedTxn !== pending.txnRef) {
        setReturnNotice('Thông tin trả về không khớp giao dịch đang chờ; hệ thống chỉ kiểm tra giao dịch đã tạo trong phiên này.');
      } else if (!responseCode || responseCode === '00') {
        setReturnNotice('Đã quay lại từ VNPay. Hệ thống đang xác minh giao dịch.');
      }
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);

      const returnParams = {};
      query.forEach((value, key) => {
        if (key.startsWith('vnp_')) returnParams[key] = value;
      });
      confirmVnPayReturn(returnParams).then((result) => {
        if (!result.verified) {
          setError(result.message || 'Backend không xác minh được kết quả VNPay trả về.');
        } else if (result.status === 'PAID') {
          setReturnNotice('Backend đã xác minh giao dịch thành công. Đang kích hoạt quyền sử dụng.');
        } else if (result.status === 'FAILED') {
          setReturnNotice('Backend đã xác minh giao dịch không thành công.');
        }
      }).catch((returnError) => {
        setError(returnError.message || 'Không thể gửi kết quả VNPay về Backend để xác minh.');
      });
    }
  }, [accessStatus]);

  const finishPaidPayment = useCallback(async (current) => {
    if (pollInFlight.current) return;
    pollInFlight.current = true;
    setPhase('claiming');
    setError('');
    try {
      const claimed = await claimPayment(current.claimSecret);
      if (!claimed.accessToken) throw new Error('Backend chưa trả access token dịch vụ.');
      const activated = await onUnlock(claimed.accessToken, current.txnRef);
      if (!activated) throw new Error('Thanh toán đã xác nhận nhưng chưa thể xác minh quyền sử dụng. Hãy thử tải lại trạng thái.');
      clearPendingPayment();
      setPhase('success');
    } catch (claimError) {
      setError(claimError.message || 'Chưa thể nhận quyền sử dụng.');
      setPhase('pending');
    } finally {
      pollInFlight.current = false;
    }
  }, [onUnlock]);

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
      if (!next.paymentUrl) {
        setError('Backend trả về URL thanh toán không hợp lệ. Giao dịch vẫn được kiểm tra an toàn.');
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
            <p className="pg__message">Backend đã xác nhận giao dịch và kích hoạt quyền sử dụng.</p>
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
                  <strong>{phase === 'claiming' ? 'Đang kích hoạt quyền sử dụng' : 'Đang chờ VNPay xác nhận'}</strong>
                  <p>{returnNotice || 'Trạng thái được xác minh định kỳ với Backend. Không đóng trang cho đến khi hệ thống cập nhật.'}</p>
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
                <button type="button" className="pg__btn" disabled>Đang khởi tạo giao dịch…</button>
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
              {phase === 'pending' && gatewayReturnedFailure && (
                <p className="pg__message">Chưa bắt đầu giao dịch mới để tránh thu tiền trùng khi Backend chưa xác nhận kết quả.</p>
              )}
            </div>

            <ol className="pg__steps">
              <li>Backend tạo giao dịch và xác định số tiền.</li>
              <li>Hoàn tất thanh toán trên cổng VNPay Sandbox.</li>
              <li>Quay lại trang này để Backend xác minh và cấp quyền.</li>
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
