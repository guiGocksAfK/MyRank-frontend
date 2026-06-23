import React from 'react';

export default function Footer({
  // Stats opcionais — vem do Dashboard.jsx
  stats = { obras: 0, horas: 0, amigos: 0 },
  isDark,
  onThemeToggle,
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="mr-status-footer">

      {/* ── Ribbon superior ── */}
      <div className="mr-status-ribbon">
        <div className="mr-status-ribbon-inner">

          {/* Esquerda: marca + versão */}
          <div className="mr-status-brand">
            <span className="mr-status-logo">
              <span className="mr-status-dot" />
              <span className="mr-logo-white">My</span>
              <span className="mr-logo-gold">Rank</span>
            </span>
            <span className="mr-status-version">v1.0</span>
          </div>

          {/* Centro: stats ao vivo (some no mobile) */}
          <div className="mr-status-stats">
            <span className="mr-status-stat">
              <span className="mr-status-stat-num">{stats.obras}</span>
              <span className="mr-status-stat-label">obras</span>
            </span>
            <span className="mr-status-divider" />
            <span className="mr-status-stat">
              <span className="mr-status-stat-num">{stats.horas}h</span>
              <span className="mr-status-stat-label">registradas</span>
            </span>
            <span className="mr-status-divider" />
            <span className="mr-status-stat">
              <span className="mr-status-stat-num">{stats.amigos}</span>
              <span className="mr-status-stat-label">amigos</span>
            </span>
          </div>

          {/* Direita: tema + topo */}
          <div className="mr-status-actions">
            <button
              className="mr-status-btn"
              onClick={onThemeToggle}
              title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              aria-label="Alternar tema"
            >
              {isDark ? '🌙' : '☀️'}
            </button>
            <button
              className="mr-status-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Voltar ao topo"
              aria-label="Voltar ao topo"
            >
              ↑
            </button>
          </div>

        </div>
      </div>

      {/* ── Faixa inferior: links + copyright ── */}
      <div className="mr-status-bottom">
        <div className="mr-status-bottom-inner">
          <nav className="mr-status-links">
            <a className="mr-status-link" href="#">Sobre</a>
            <span className="mr-status-bullet">·</span>
            <a className="mr-status-link" href="#">Privacidade</a>
            <span className="mr-status-bullet">·</span>
            <a className="mr-status-link" href="#">Termos</a>
            <span className="mr-status-bullet">·</span>
            <a className="mr-status-link" href="#">Ajuda</a>
          </nav>
          <span className="mr-status-copyright">© {year} MyRank</span>
        </div>
      </div>

    </footer>
  );
}