// src/components/PaymentGate.jsx
import { useState } from 'react';

/**
 * QR GIẢ — chỉ để demo, không chuyển khoản thật
 * Quét ra sẽ chỉ hiển thị text, không phải thông tin ngân hàng
 */
const QR_CONTENT = 'HOIAN_TOUR_DEMO_20000';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(QR_CONTENT)}&bgcolor=ffffff&color=2b1d12&margin=0`;

const CONFIG = {
  PRICE: 20000,
  ADD_INFO: 'HOIAN TOUR',
  HOTLINE: '0909 123 456',
};

const VALID_CODES = ['HOIAN2025', 'DEMO123', 'SGUPROJECT'];

export default function PaymentGate({ onUnlock }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleConfirm = () => {
    const input = code.trim().toUpperCase();
    if (!input) {
      setError('Vui lòng nhập mã unlock.');
      return;
    }
    setChecking(true);
    setError('');
    setTimeout(() => {
      if (VALID_CODES.includes(input)) {
        onUnlock();
      } else {
        setChecking(false);
        setError('Mã không đúng. Vui lòng thử lại.');
      }
    }, 800);
  };

  return (
    <div className="pg">
      <div className="pg__card">

        {/* Header */}
        <header className="pg__head">
          <h1 className="pg__title">Hội An</h1>
          <p className="pg__subtitle">Di sản &amp; Ẩm thực</p>
        </header>

        {/* Intro */}
        <div className="pg__intro">
          <p className="pg__intro-text">
            Thanh toán <strong>{CONFIG.PRICE.toLocaleString('vi-VN')}đ</strong> để truy cập
            toàn bộ 20 điểm đến, bản đồ tương tác và thuyết minh 5 ngôn ngữ.
          </p>
        </div>

        {/* QR giả */}
        <div className="pg__qr-wrap">
          <img
            className="pg__qr"
            src={QR_URL}
            alt="QR thanh toán"
            width="220"
            height="220"
          />
        </div>

        {/* Info */}
        <div className="pg__info">
          <div className="pg__info-row">
            <span>Số tiền</span>
            <strong>{CONFIG.PRICE.toLocaleString('vi-VN')}đ</strong>
          </div>
          <div className="pg__info-row">
            <span>Nội dung</span>
            <strong>{CONFIG.ADD_INFO}</strong>
          </div>
          <div className="pg__info-row">
            <span>Mã giao dịch</span>
            <strong>{QR_CONTENT}</strong>
          </div>
        </div>

        {/* Divider */}
        <div className="pg__hr" />

        {/* Unlock */}
        <div className="pg__unlock">
          <label className="pg__label" htmlFor="pg-code">
            Nhập mã unlock
          </label>
          <input
            id="pg-code"
            type="text"
            className="pg__input"
            placeholder="HOIAN2025"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            disabled={checking}
            autoComplete="off"
            spellCheck="false"
            maxLength={20}
          />

          {error && <p className="pg__error">{error}</p>}

          <button
            type="button"
            className="pg__btn"
            onClick={handleConfirm}
            disabled={checking}
          >
            {checking ? 'Đang kiểm tra...' : 'Xác nhận'}
          </button>
        </div>

        {/* Footer */}
        <footer className="pg__foot">
          <p>Sau khi thanh toán, mã unlock sẽ được gửi qua Zalo hoặc SMS.</p>
          <p>
            Hỗ trợ: <a href={`tel:${CONFIG.HOTLINE.replace(/\s/g, '')}`}>{CONFIG.HOTLINE}</a>
          </p>
        </footer>

      </div>
    </div>
  );
}