export default function Footer({ t, onOpenMap }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__big">HỘI AN</div>
        <div className="footer__grid">
          <div className="footer__sub">{t('footer.sub')}</div>
          <div>
            <div className="footer__title">{t('footer.explore')}</div>
            <ul className="footer__list">
              <li>
                <button type="button" className="footer__link" onClick={onOpenMap}>
                  {t('footer.map')}
                </button>
              </li>
              <li><a href="#di-san" className="footer__link">{t('footer.heritage')}</a></li>
              <li><a href="#am-thuc" className="footer__link">{t('footer.food')}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2025 Hội An</span>
          <span>Maplibre · MyMemory API</span>
        </div>
      </div>
    </footer>
  );
}