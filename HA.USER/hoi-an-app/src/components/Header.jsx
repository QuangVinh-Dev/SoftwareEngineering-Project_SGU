import { useState } from 'react';
import { LANGS } from '../data/langs';

const flagSrc = cc => `https://flagcdn.com/w40/${cc}.png`;
const flagImg = (cc, alt) => (
  <img className="flag" src={flagSrc(cc)} alt={alt || ''} width="24" height="16" loading="lazy" />
);

export default function Header({
  t, currentLang, setLang,
  onOpenMap, onOpenAll
}) {
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const L = LANGS.find(x => x.code === currentLang) || LANGS[0];

  const navItems = [
    { href:'#di-san', key:'nav.heritage' },
    { href:'#ton-giao', key:'nav.religion' },
    { href:'#am-thuc', key:'nav.food' },
    { href:'#lang-nghe', key:'nav.craft' },
    { href:'#gan-hoi-an', key:'nav.near' },
  ];

  const handleLangClick = (code) => {
    setLangOpen(false);
    setLang(code);
  };

  return (
    <header className="header">
      <div className="header__inner">
        <a href="#" className="header__logo">
          <div className="header__mark">HA</div>
          <div>
            <div className="header__name">{t('brand.name')}</div>
            <div className="header__tag">{t('brand.tag')}</div>
          </div>
        </a>

        <nav className="header__nav">
          {navItems.map(item => (
            <a key={item.href} href={item.href} className="nav-link">
              <span>{t(item.key)}</span>
            </a>
          ))}
          <button type="button" className="nav-link" onClick={onOpenAll}>
            <span>{t('nav.all')}</span>
          </button>
          <button type="button" className="nav-link nav-link--map" onClick={onOpenMap}>
            <span>{t('nav.map')}</span>
          </button>
        </nav>

        <div className="header__right">
          <div className={`lang-select${langOpen ? ' is-open' : ''}`} id="langSelect">
            <button
              type="button"
              className="lang-btn"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label="Language"
              onClick={(e) => { e.stopPropagation(); setLangOpen(v => !v); }}
            >
              {flagImg(L.cc)}
              <span>{L.name}</span>
              <span className="lang-select__arrow">▼</span>
            </button>
            <ul className="lang-menu" role="listbox">
              {LANGS.map(lang => (
                <li key={lang.code} role="option">
                  <button
                    type="button"
                    className={`lang-opt${lang.code === currentLang ? ' is-active' : ''}`}
                    onClick={() => handleLangClick(lang.code)}
                  >
                    {flagImg(lang.cc)}
                    <span>{lang.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="burger"
            aria-label="Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(v => !v)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      <nav className={`mobile-nav${mobileOpen ? ' is-open' : ''}`}>
        {navItems.map(item => (
          <a key={item.href} href={item.href} className="nav-link" onClick={() => setMobileOpen(false)}>
            <span>{t(item.key)}</span>
          </a>
        ))}
        <button
          type="button"
          className="nav-link"
          onClick={() => { setMobileOpen(false); onOpenAll(); }}
        >
          <span>{t('nav.all')}</span>
        </button>
        <button
          type="button"
          className="nav-link nav-link--map"
          onClick={() => { setMobileOpen(false); onOpenMap(); }}
        >
          <span>{t('nav.map')}</span>
        </button>
      </nav>
    </header>
  );
}