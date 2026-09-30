import React, { useRef } from 'react';

export default function Player({ isOpen, isPlaying, progress, timeText, title, meta, onTogglePlay, onClose, onSeek }) {
  const barRef = useRef(null);

  const handleBarClick = (e) => {
    const r = barRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
    onSeek(percent);
  };

  return (
    <div className={`player${isOpen ? ' is-open' : ''}`}>
      <div className="player__inner">
        <button className="player__btn" onClick={onTogglePlay}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div>
          <div className="player__title">{title}</div>
          <div className="player__meta">{meta}</div>
        </div>
        <div className="player__bar" ref={barRef} onClick={handleBarClick}>
          <div className="player__fill" style={{ width: progress + '%' }} />
        </div>
        <div className="player__time">{timeText}</div>
        <button className="player__close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}