import React from 'react';

export default function Topbar({ t }) {
  return (
    <div className="topbar">
      <div className="topbar__inner">
        <span className="topbar__gold">{t('topbar.left')}</span>
        <span className="topbar__right">{t('topbar.right')}</span>
      </div>
    </div>
  );
}