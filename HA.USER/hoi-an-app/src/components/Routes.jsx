import React from 'react';
import { ROUTES } from '../data/routes';

export default function Routes({ t, pois = [], loading = false, error = null, getPoiText, onOpenPoi }) {
  return (
    <section className="routes" id="lo-trinh">
      <div className="wrap">
        <div className="routes__head">
          <h2 className="routes__title">{t('route.title')}</h2>
          <p className="routes__sub">{t('route.sub')}</p>
        </div>
        <div className="routes__grid">
          {ROUTES.map(r => (
            <article className="route" key={r.key}>
              <div className="route__head">
                <h3 className="route__title">{t(r.key + '.t')}</h3>
                <span className="route__time">{t(r.key + '.time')}</span>
              </div>
              <ol className="route__stops">
                {r.stops.map((id, i) => {
                  const p = pois.find(x => Number(x.id) === Number(id));
                  if (!p) return null;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className="route__stop"
                        onClick={() => onOpenPoi(p)}
                      >
                        <span className="route__n">{String(i + 1).padStart(2, '0')}</span>
                        <span className="route__name">{getPoiText(p).name}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </article>
          ))}
        </div>
      </div>
      {error && <p role="alert">Không thể tải POI cho lộ trình: {error}</p>}
      {loading && <p>Đang tải dữ liệu lộ trình…</p>}
    </section>
  );
}
