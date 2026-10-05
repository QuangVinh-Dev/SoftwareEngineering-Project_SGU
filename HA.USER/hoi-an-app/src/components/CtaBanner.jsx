import React from 'react';

export default function CtaBanner({ t, onOpenMap }) {
  return (
    <section className="cta-banner">
      <div className="wrap">
        <h2 className="cta-banner__title">{t('cta.title')}</h2>
        <p className="cta-banner__sub">{t('cta.sub')}</p>
        <button type="button" className="btn btn--primary" onClick={onOpenMap}>
          {t('cta.btn')}
        </button>
      </div>
    </section>
  );
}