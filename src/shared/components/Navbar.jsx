import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage, LANGUAGES } from "../i18n";
import "./Navbar.css";

const UserIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const Navbar = () => {
  const [langOpen, setLangOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

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
        <Link className="navbar-link hide-on-small" to="/" onClick={scrollToTop}>
          {t.nav.home}
        </Link>

        <div className="navbar-language">
          <button
            className="navbar-ghost"
            type="button"
            onClick={() => setLangOpen((open) => !open)}
            aria-expanded={langOpen}
          >
            {lang}
            <span aria-hidden="true">&#9662;</span>
          </button>

          {langOpen && (
            <div className="navbar-menu">
              {LANGUAGES.map((language) => (
                <button
                  key={language}
                  className={language === lang ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setLang(language);
                    setLangOpen(false);
                  }}
                >
                  {language}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link className="navbar-ghost hide-on-small" to="/entrar">
          {t.nav.login}
        </Link>

        <Link className="navbar-primary" to="/cadastrar">
          {t.nav.signup}
        </Link>
      </div>
    </nav>
  );
};
export default Navbar;