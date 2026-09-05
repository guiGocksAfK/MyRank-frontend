import logo from '../../assets/logo.png'
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import './homePage.css';
import { getShowcasePosters } from '../../services/ExternalSearchService';
import { SHOWCASE_FALLBACK } from './showcaseFallback';
import { useLanguage } from '../../shared/i18n';

const MEDIA_ICONS = ["🎬", "📺", "🎮", "📚", "⛩️"];
const STEP_NUMS = ["01", "02", "03", "04"];

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

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`home-faq-item ${open ? 'is-open' : ''}`}
      onClick={() => setOpen(!open)}
    >
      <div className="home-faq-row">
        <span className="home-faq-question">{question}</span>
        <span className="home-faq-plus">+</span>
      </div>
      {open && <p className="home-faq-answer">{answer}</p>}
    </div>
  );
};

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

          <Link to="/cadastrar" className="home-cta">
            {t.home.hero.cta}
          </Link>

          <div className="home-media-grid">
            {t.home.medias.map((label, i) => (
              <div key={label} className="home-media-item">
                <span className="home-media-icon">{MEDIA_ICONS[i]}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

  {/* Como funciona */}
<section style={{
  padding: "60px 2rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "40px",
}}>
  <h2 style={{
    fontSize: "36px",
    fontWeight: "800",
    color: "#e5e5e5",
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "center",
  }}>
    {t.home.how.title}
  </h2>

  <div style={{
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: "1400px",
  }}>
   {t.home.how.steps.map((rawStep, stepIndex) => ({ ...rawStep, num: STEP_NUMS[stepIndex] })).map((step) => (
          <div key={step.num} style={{
        backgroundColor: "#111111",
        borderTop: "2px solid #d4af37",
        border: "1px solid #2a2a2a",
        borderRadius: "12px",
        padding: "28px",
        flex: "1",
        minWidth: "240px",
        maxWidth: "320px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "default",
        transition: "all 0.2s",
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.borderColor = "#d4af37";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(212,175,55,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "#2a2a2a";
          e.currentTarget.style.boxShadow = "none";
        }}
>
        <span style={{
          fontSize: "36px",
          fontWeight: "800",
          color: "#d4af37",
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1,
        }}>{step.num}</span>
        <h3 style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "#e5e5e5",
          fontFamily: "'DM Sans', sans-serif",
        }}>{step.title}</h3>
        <p style={{
          fontSize: "14px",
          color: "#888",
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: "1.7",
        }}>{step.desc}</p>
      </div>
    ))}
  </div>
</section>

{/* Números de impacto */}
<section style={{
  padding: "60px 2rem",
  display: "flex",
  justifyContent: "center",
  gap: "64px",
  flexWrap: "wrap",
  borderTop: "1px solid #2a2a2a",
  borderBottom: "1px solid #2a2a2a",
}}>
  {t.home.impact.map((item) => (
    <div key={item.label} style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    }}>
      <span style={{
        fontSize: "48px",
        fontWeight: "800",
        color: "#d4af37",
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1,
      }}>{item.num}</span>
      <span style={{
        fontSize: "14px",
        color: "#888",
        fontFamily: "'DM Sans', sans-serif",
      }}>{item.label}</span>
    </div>
  ))}
</section>

{/* FAQ */}
<section id="faq" style={{
  padding: "80px 2rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "48px",
}}>
  <h2 style={{
    fontSize: "36px",
    fontWeight: "800",
    color: "#e5e5e5",
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "center",
  }}>
    {t.home.faq.title}
  </h2>

  <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "800px",
  }}>
    {t.home.faq.items.map((item, i) => (
      <FAQItem key={i} question={item.q} answer={item.a} />
    ))}
  </div>
</section>

{/* Footer */}
<footer style={{
  borderTop: "1px solid #2a2a2a",
  padding: "26px 6rem 24px",
  display: "flex",
  flexDirection: "column",
  gap: "48px",
}}>
  
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
}}>

  {/* Coluna 1 — Logo */}
  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "180px" }}>
    <img src={logo} alt="MyRank" style={{ height: "48px", objectFit: "contain" }} />
    <p style={{ fontSize: "13px", color: "#555", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, textAlign: "center" }}>
      {t.home.footer.tagline}
    </p>
  </div>

  {/* Coluna 2 — Produto */}
  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
    <span style={{ fontSize: "11px", fontWeight: "700", color: "#555", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "1.5px" }}>{t.home.footer.colProduct}</span>
    {t.home.footer.productLinks.map((link) => (
      <a key={link} href="#" style={{ fontSize: "14px", color: "#888", fontFamily: "'DM Sans', sans-serif", textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e5e5")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
      >{link}</a>
    ))}
  </div>

  {/* Coluna 3 — Redes */}
  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
    <span style={{ fontSize: "11px", fontWeight: "700", color: "#555", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "1.5px" }}>{t.home.footer.colSocial}</span>
    {[
      { label: "GitHub", href: "https://github.com/guiGocksAfK", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#888"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg> },
      { label: "Instagram", href: "https://www.instagram.com/guilhermegocks/", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="#888"/></svg> },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/guilherme-gabriel-gocks-023846352/", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#888"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg> },
      { label: "WhatsApp", href: "https://wa.me/554599546529", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#888"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.523 5.84L.057 23.428a.5.5 0 0 0 .619.612l5.76-1.51A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 0 1-5.03-1.362l-.36-.214-3.733.979.995-3.64-.235-.374A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> },
    ].map((rede) => (
      <a key={rede.label} href={rede.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: "14px", color: "#888", fontFamily: "'DM Sans', sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e5e5")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
      >{rede.icon}{rede.label}</a>
    ))}
  </div>

</div>

  {/* Bottom */}
  <div style={{
    borderTop: "1px solid #2a2a2a",
    paddingTop: "20px",
    display: "flex",
    justifyContent: "center",
  }}>
    <span style={{ fontSize: "13px", color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
      {t.home.footer.copyright}
    </span>
  </div>

</footer>

    </main>
  )
}

export default HomePage