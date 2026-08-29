import React from 'react';
import { useUnifiedItems, computeStats } from '../../shared/useUnifiedItems';
import { useLanguage } from '../../shared/i18n';

export default function DashboardFooter({
  // Override opcional; por padrão os números vêm de /works/unified.
  stats: statsOverride,
}) {
  const year = new Date().getFullYear();
  const { t } = useLanguage();
  const tf = t.dash.footer;
  const { items, loading } = useUnifiedItems();
  const derived = computeStats(items || []);
  const stats = statsOverride ?? { obras: derived.obras, horas: derived.totalHours };
  const dash = loading && !statsOverride ? '—' : null;

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
              <span className="mr-status-stat-num">{dash ?? stats.obras}</span>
              <span className="mr-status-stat-label">{tf.works}</span>
            </span>
            <span className="mr-status-divider" />
            <span className="mr-status-stat">
              <span className="mr-status-stat-num">{dash ?? `${stats.horas}h`}</span>
              <span className="mr-status-stat-label">{tf.registered}</span>
            </span>
          </div>

          {/* Direita: topo */}
          <div className="mr-status-actions">
            <button
              className="mr-status-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title={tf.backToTop}
              aria-label={tf.backToTop}
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
            {tf.links.map((link, i) => (
              <React.Fragment key={link}>
                {i > 0 && <span className="mr-status-bullet">·</span>}
                <a className="mr-status-link" href="#">{link}</a>
              </React.Fragment>
            ))}
          </nav>
          <span className="mr-status-copyright">© {year} MyRank</span>
        </div>
      </div>

    </footer>
  );
}