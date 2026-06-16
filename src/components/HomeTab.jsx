import React, { useState } from 'react';
import { mediaItems, badges } from '../data/mockData';

const typeIcons = {
  filme: '🎬',
  jogo: '🎮',
  serie: '📺',
  livro: '📚',
};

const typeLabels = {
  filme: 'Filme',
  jogo: 'Jogo',
  serie: 'Série',
  livro: 'Livro',
};

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m > 0) return `${h}h ${m}min`;
  return `${h}h`;
}

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'há 1 dia';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 14) return 'há 1 semana';
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 60) return 'há 1 mês';
  return `há ${Math.floor(diffDays / 30)} meses`;
}

export default function HomeTab() {
  const [weighted, setWeighted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const totalHours = Math.round(
    mediaItems.reduce((sum, item) => sum + item.timeMinutes, 0) / 60
  );
  const avgNote = (
    mediaItems.reduce((sum, item) => sum + item.finalNote, 0) / mediaItems.length
  ).toFixed(1);
  const unlockedBadges = badges.filter((b) => b.unlocked).length;
  const totalBadges = badges.length;

  const getNote = (item) => weighted ? item.finalNote : item.note;

  const top5 = [...mediaItems]
    .sort((a, b) => getNote(b) - getNote(a))
    .slice(0, 5);

  const recentBadges = badges.filter((b) => b.unlocked).slice(0, 4);

  const stats = [
    { icon: '🎞️', value: mediaItems.length, label: 'Obras Avaliadas' },
    { icon: '⭐', value: avgNote, label: 'Nota Média' },
    { icon: '⏱️', value: `${totalHours}h`, label: 'Horas Consumidas' },
    { icon: '🏅', value: `${unlockedBadges}/${totalBadges}`, label: 'Badges Desbloqueados' },
  ];

  return (
    <div className="mr-space-y-6">
      {/* Welcome */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Olá, <span style={{ color: 'var(--mr-gold)' }}>Lucas</span> 👋
        </h1>
        <p style={{ color: 'var(--mr-text-secondary)', marginTop: 4 }}>
          Aqui está o resumo do seu ranking pessoal
        </p>
      </div>

      {/* Stat Cards */}
      <div className="mr-stats-grid">
        {stats.map((stat, i) => (
          <div className="mr-stat-card" key={i}>
            <div className="mr-stat-icon-row">
              <span className="mr-stat-icon">{stat.icon}</span>
              <div className="mr-stat-dot" />
            </div>
            <div className="mr-stat-value">{stat.value}</div>
            <div className="mr-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Poster Grid */}
      <div>
        <div className="mr-section-header">
          <h2 className="mr-section-title">🔥 Avaliações Recentes</h2>
          <button className="mr-link-btn">Ver todas →</button>
        </div>
        <div className="mr-poster-grid">
          {mediaItems.slice(0, 6).map((item) => (
            <div className="mr-poster" key={item.id}>
              <div className="mr-poster-rating">{item.finalNote.toFixed(1)}</div>
              <div className="mr-poster-inner">
                <div className="mr-poster-placeholder">
                  <span className="mr-poster-placeholder-icon">
                    {typeIcons[item.type]}
                  </span>
                  <span className="mr-poster-placeholder-title">{item.title}</span>
                </div>
                <div className="mr-poster-overlay">
                  <span className="mr-poster-overlay-type">
                    {typeLabels[item.type]}
                  </span>
                  <span className="mr-poster-overlay-title">{item.title}</span>
                  <div className="mr-poster-overlay-badges">
                    <span className="mr-poster-overlay-note">
                      {item.note.toFixed(1)}
                    </span>
                    <span className="mr-poster-overlay-bonus">
                      +{item.bonusTime.toFixed(1)} bônus
                    </span>
                  </div>
                  <span className="mr-poster-overlay-time">
                    {formatTime(item.timeMinutes)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="mr-two-col">

        {/* Top 5 */}
        <div className="mr-card">
          <div className="mr-card-body">

            {/* Header do card com switch */}
            <div className="mr-flex mr-items-center mr-justify-between mr-mb-4">
              <h3 className="mr-section-title">🏆 Top 5 Obras</h3>
              <div className="mr-flex mr-items-center mr-gap-2">
                <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', whiteSpace: 'nowrap' }}>
                  Ponderada
                </span>

                {/* Botão de info com tooltip */}
                <div style={{ position: 'relative' }}>
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: '1px solid var(--mr-border)',
                      background: 'transparent',
                      color: 'var(--mr-text-muted)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      padding: 0,
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                  >
                    ?
                  </button>

                  {showTooltip && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      bottom: 'calc(100% + 8px)',
                      width: 220,
                      background: '#1a1a1a',
                      border: '1px solid #303030',
                      borderRadius: 10,
                      padding: '10px 12px',
                      fontSize: '0.75rem',
                      color: 'var(--mr-text-secondary)',
                      lineHeight: 1.5,
                      zIndex: 50,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}>
                      <span style={{ color: 'var(--mr-gold)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                        Ponderação por tempo
                      </span>
                      Adiciona um bônus logarítmico baseado no tempo investido:{' '}
                      <span style={{ color: 'var(--mr-gold)', fontFamily: 'monospace' }}>
                        Nota + log₁₀(Tempo / 60min)
                      </span>
                      . Obras mais longas sobem no ranking.
                      {/* Seta do tooltip */}
                      <div style={{
                        position: 'absolute',
                        bottom: -5,
                        right: 6,
                        width: 8,
                        height: 8,
                        background: '#1a1a1a',
                        border: '1px solid #303030',
                        borderTop: 'none',
                        borderLeft: 'none',
                        transform: 'rotate(45deg)',
                      }} />
                    </div>
                  )}
                </div>

                {/* Switch */}
                <button
                  className={`mr-switch ${weighted ? 'checked' : ''}`}
                  onClick={() => setWeighted((prev) => !prev)}
                  aria-label="Ativar ponderação por tempo"
                >
                  <div className="mr-switch-thumb" />
                </button>
              </div>
            </div>

            {/* Lista Top 5 */}
            <div className="mr-space-y-2">
              {top5.map((item, i) => (
                <div className="mr-rank-item" key={item.id}>
                  <span
                    className={`mr-rank-number ${
                      i === 0 ? 'mr-rank-number-1'
                      : i === 1 ? 'mr-rank-number-2'
                      : i === 2 ? 'mr-rank-number-3'
                      : ''
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="mr-rank-info">
                    <div className="mr-rank-title">{item.title}</div>
                    <div className="mr-rank-subtitle">
                      {typeLabels[item.type]} • {formatTime(item.timeMinutes)}
                    </div>
                  </div>
                  <div className="mr-rank-note-area mr-flex mr-items-center mr-gap-2">
                    <span style={{ color: 'var(--mr-gold)', fontWeight: 700 }}>
                      {getNote(item).toFixed(1)}
                    </span>
                    {weighted && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--mr-text-muted)' }}>
                        +{item.bonusTime.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé - Ver todas */}
            <div style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid var(--mr-border)',
              textAlign: 'center',
            }}>
              <button className="mr-link-btn" style={{ fontSize: '0.8125rem' }}>
                Ver todas as obras ranqueadas →
              </button>
            </div>
          </div>
        </div>

        {/* Recent Badges */}
        <div className="mr-card">
          <div className="mr-card-body">
            <h3 className="mr-section-title mr-mb-4">🎖️ Badges Recentes</h3>
            <div className="mr-space-y-3">
              {recentBadges.map((badge) => (
                <div className="mr-flex mr-items-center mr-gap-3" key={badge.id}>
                  <div className="mr-dot-green" />
                  <span style={{ fontSize: '1.25rem' }}>{badge.icon}</span>
                  <div className="mr-flex-1 mr-min-w-0">
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {badge.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
                      {badge.description}
                    </div>
                  </div>
                  {/* Tempo desde a conquista */}
                  {badge.unlockedAt && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--mr-text-muted)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {timeAgo(badge.unlockedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info Card - Formula */}
      <div className="mr-info-card-blue">
        <div className="mr-card-body mr-flex mr-items-start mr-gap-4">
          <span style={{ fontSize: '1.5rem' }}>📐</span>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Como funciona a ponderação por tempo?
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>
              A nota final é calculada somando a nota original com um bônus baseado no
              tempo investido. A fórmula é:{' '}
              <span className="mr-code mr-code-gold">
                Nota Final = Nota Original + log₁₀(Tempo / 60min)
              </span>
              . Obras que exigem mais tempo recebem um bônus maior, valorizando o
              investimento do usuário.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}