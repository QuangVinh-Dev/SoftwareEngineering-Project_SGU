import { useState, useEffect } from 'react';

export default function SearchBox({ value, onChange, placeholder }) {
  const [local, setLocal] = useState(value || '');

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 200);
    return () => clearTimeout(t);
  }, [local, onChange]);

  return (
    <div className="search-box">
      <span className="search-box__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="text"
        className="search-box__input"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder || 'Tìm kiếm...'}
        aria-label="Search"
      />
      {local && (
        <button
          type="button"
          className="search-box__clear"
          onClick={() => { setLocal(''); onChange(''); }}
          aria-label="Clear"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}