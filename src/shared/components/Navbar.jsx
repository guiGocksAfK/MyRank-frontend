import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage, LANGUAGES } from "../i18n";
import useDismiss from "./useDismiss";
import "./Navbar.css";

const ChevronIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 3.5 5 6.5 8 3.5" />
  </svg>
);

const Navbar = () => {
  const [langOpen, setLangOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const langRef = useRef(null);
  const langButtonRef = useRef(null);
  const closeLang = useCallback(() => setLangOpen(false), []);

  // Fecha o menu de idioma ao clicar fora ou apertar Esc
  useDismiss(langOpen, closeLang, langRef, langButtonRef);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <NavbarShell logoTo="/" onLogoClick={scrollToTop}>
      <div className="navbar-language" ref={langRef}>
        <button
          ref={langButtonRef}
          className="mr-btn mr-btn-ghost navbar-lang-btn"
          type="button"
          onClick={() => setLangOpen((open) => !open)}
          aria-expanded={langOpen}
          aria-haspopup="menu"
          aria-label={`${t.nav.subtitles}: ${lang}`}
        >
          {lang}
          <ChevronIcon />
        </button>

        {langOpen && (
          <div className="mr-menu navbar-lang-menu" role="menu" aria-label={t.nav.subtitles}>
            <div className="mr-menu-label" aria-hidden="true">{t.nav.subtitles}</div>
            {LANGUAGES.map((language) => (
              <button
                key={language}
                className="mr-menu-item"
                type="button"
                role="menuitemradio"
                aria-checked={language === lang}
                onClick={() => {
                  if (language !== lang) setLang(language);
                  setLangOpen(false);
                }}
              >
                <span className="mr-menu-radio" aria-hidden="true" />
                {language}
              </button>
            ))}
          </div>
        )}
      </div>

      <Link className="mr-btn mr-btn-ghost" to="/entrar">
        {t.nav.login}
      </Link>

      <Link className="mr-btn mr-btn-gold" to="/cadastrar">
        {t.nav.signup}
      </Link>
    </NavbarShell>
  );
};

/**
 * Moldura comum a todas as navbars do site: mesma altura, fundo fosco, borda e
 * logo. A da home e a do app logado só mudam o recheio (center e children).
 */
export function NavbarShell({ logoTo, onLogoClick, center, children }) {
  return (
    <nav className={`navbar${center ? " navbar-has-center" : ""}`}>
      <Link className="navbar-logo" to={logoTo} onClick={onLogoClick}>
        <span>My</span>
        <span>Rank</span>
      </Link>
      {center && <div className="navbar-center">{center}</div>}
      <div className="navbar-actions">{children}</div>
    </nav>
  );
}
export default Navbar;