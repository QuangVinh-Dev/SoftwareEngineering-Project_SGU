// src/components/Player.jsx
import React, { useRef } from 'react';

export default function Player({
  isOpen,
  isPlaying,
  progress,
  timeText,
  title,
  meta,
  queueLength = 0,
  onTogglePlay,
  onClose,
  onSeek,
}) {
  const barRef = useRef(null);

  const handleBarClick = (e) => {
    if (!onSeek) return;
    const r = barRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    onSeek(percent);
  };

  return (
    <div className={`player${isOpen ? ' is-open' : ''}`}>
      <div className="player__inner">
        <button
          className="player__btn"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="player__info">
          <div className="player__title">{title}</div>
          <div className="player__meta">
            {meta}
            {queueLength > 0 && (
              <span className="player__queue"> · {queueLength} tiếp theo</span>
            )}
          </div>
        </div>

        <div className="player__bar" ref={barRef} onClick={handleBarClick}>
          <div className="player__fill" style={{ width: progress + '%' }} />
        </div>

        <div className="player__time">{timeText}</div>

        <button className="player__close" onClick={onClose} aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}