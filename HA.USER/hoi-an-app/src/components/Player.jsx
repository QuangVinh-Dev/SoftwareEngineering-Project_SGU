// src/components/Player.jsx
import React, { useRef } from 'react';

export default function Player({
  isOpen,
  isPlaying,
  isLoading = false,
  progress = 0,
  timeText,
  title,
  meta,
  queueLength = 0,
  onTogglePlay,
  onClose,
  onSeek,
}) {
  const barRef = useRef(null);

  // Xử lý tua audio khi nhấn vào thanh tiến trình
  const handleBarClick = (e) => {
    if (!onSeek || !barRef.current || isLoading) return;

    const rect = barRef.current.getBoundingClientRect();

    if (rect.width <= 0) return;

    const percent = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
    );

    onSeek(percent);
  };

  // Đảm bảo progress luôn nằm trong khoảng 0 - 100
  const safeProgress = Math.max(
    0,
    Math.min(100, Number(progress) || 0)
  );

  return (
    <div className={`player${isOpen ? ' is-open' : ''}`}>
      <div className="player__inner">

        {/* Nút phát / tạm dừng */}
        <button
          type="button"
          className="player__btn"
          onClick={onTogglePlay}
          disabled={isLoading}
          aria-label={isLoading ? 'Đang tải' : isPlaying ? 'Tạm dừng' : 'Phát'}
        >
          {isPlaying ? (
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Thông tin audio */}
        <div className="player__info">
          <div className="player__title">
            {title || 'Chưa có nội dung'}
          </div>

          <div className="player__meta">
            {isLoading ? 'Đang tải audio…' : meta}
            {queueLength > 0 && (
              <span className="player__queue">
                {' '}· {queueLength} tiếp theo
              </span>
            )}
          </div>
        </div>

        {/* Thanh tiến trình */}
        <div
          className="player__bar"
          ref={barRef}
          onClick={handleBarClick}
          role="progressbar"
          aria-label="Tiến trình phát audio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeProgress}
        >
          <div
            className="player__fill"
            style={{ width: `${safeProgress}%` }}
          />
        </div>

        {/* Thời gian */}
        <div className="player__time">
          {timeText || '00:00'}
        </div>

        {/* Nút đóng */}
        <button
          type="button"
          className="player__close"
          onClick={onClose}
          aria-label="Đóng"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

      </div>
    </div>
  );
}
