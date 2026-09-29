import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import './homePage.css';
import { getShowcasePosters } from '../../services/ExternalSearchService';
import { SHOWCASE_FALLBACK } from './showcaseFallback';
import { useLanguage } from '../../shared/i18n';
import HowItWorks from './HowItWorks';
import HomeIdentity from './HomeIdentity';
import HomeSocial from './HomeSocial';
import HomeFaq from './HomeFaq';
import HomeCredits from './HomeCredits';
import HomeFooter from './HomeFooter';

const POSTER_TILES = 20; // grid 5x4 do hero
const GRID_COLS = 5;
const GRID_ROWS = POSTER_TILES / GRID_COLS;            // 4
const MAX_DIAG = (GRID_ROWS - 1) + (GRID_COLS - 1);    // 7 — diagonal do canto NO ao SE
const TILE_STEP_MS = 85;

/**
 * Revela em duas frentes: uma vinda do canto noroeste, outra do sudeste,
 * que se encontram na diagonal central. `wave` é a distância até o canto
 * (NO ou SE) mais próximo; `shift` diz de que lado o tile entra deslizando.
 */
const tileReveal = (i) => {
  const diag = Math.floor(i / GRID_COLS) + (i % GRID_COLS);
  const wave = Math.min(diag, MAX_DIAG - diag);
  const half = MAX_DIAG / 2;
  const shift = diag < half ? '-14px' : diag > half ? '14px' : '0px';
  return { '--tile-delay': `${wave * TILE_STEP_MS}ms`, '--tile-shift': shift };
};
const SHOWCASE_WAIT_MS = 600;   // espera curta pelo /showcase antes de decidir a lista
const REVEAL_CAP_MS = 1200;     // teto: revela o grid mesmo que alguma imagem trave

/** Junta os pôsteres ao vivo com o fallback estático, sem repetir, até 20 tiles. */
const buildTiles = (live) => [...new Set([...live, ...SHOWCASE_FALLBACK])].slice(0, POSTER_TILES);

/** Pré-carrega todas as URLs; resolve quando todas terminam (load ou erro). */
const preloadAll = (urls) =>
  Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = url;
        })
    )
  );

const HomePage = () => {
  const { t } = useLanguage();
  const [tiles, setTiles] = useState(() => buildTiles([]));
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let active = true;

    // 1. Decide a lista final: usa o /showcase se responder rápido, senão o fallback.
    Promise.race([
      getShowcasePosters().catch(() => []),
      new Promise((resolve) => setTimeout(() => resolve(null), SHOWCASE_WAIT_MS)),
    ])
      .then((live) => {
        const finalTiles = Array.isArray(live) && live.length ? buildTiles(live) : buildTiles([]);
        if (active) setTiles(finalTiles);
        // 2. Pré-carrega tudo antes de revelar — sem "pipoca".
        return preloadAll(finalTiles);
      })
      .then(() => {
        if (active) setRevealed(true);
      });

    // 3. Teto de segurança: revela mesmo que o preload trave.
    const cap = setTimeout(() => active && setRevealed(true), REVEAL_CAP_MS);

    return () => {
      active = false;
      clearTimeout(cap);
    };
  }, []);

  return (
    <main className="home-page">

      <section className="home-hero">
        <div className={`home-poster-grid${revealed ? ' is-revealed' : ''}`}>
          {tiles.map((url, i) => (
            <div
              key={i}
              className="home-poster-tile"
              style={{
                backgroundImage: `url(${url})`,
                ...tileReveal(i),
              }}
            />
          ))}
        </div>

        <div className="home-overlay" />

        <div className="home-content">
          <h1 className="home-title">
            {t.home.hero.title1}<br />
            {t.home.hero.title2}<br />
            <span className="home-title-accent">{t.home.hero.title3}</span>
          </h1>

          <p className="home-subtitle">
            {t.home.hero.subtitle}
          </p>

          <Link to="/cadastrar" className="mr-btn mr-btn-gold mr-btn-lg home-cta">
            {t.home.hero.cta}
          </Link>

          <p className="home-categories">
            {t.home.hero.categories.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </p>
        </div>
      </section>

  <HowItWorks how={t.home.how} />
  <HomeSocial social={t.home.social} compare={t.home.compare} takes={t.home.takes} />
  <HomeIdentity identity={t.home.identity} />

  <HomeFaq faq={t.home.faq} />
  <HomeCredits credits={t.home.credits} />

  <HomeFooter footer={t.home.footer} />

    </main>
  )
}

export default HomePage