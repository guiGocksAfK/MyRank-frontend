import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage, LANGUAGES } from "../i18n";
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

  // Fecha o menu de idioma ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!langOpen) return undefined;
    const onPointerDown = (e) => {
      if (!langRef.current?.contains(e.target)) setLangOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setLangOpen(false);
        langButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [langOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="navbar">
      <Link className="navbar-logo" to="/" onClick={scrollToTop}>
        <span>My</span>
        <span>Rank</span>
      </Link>

      <div className="navbar-actions">
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
      </div>
    </nav>
  );
};
export default Navbar;