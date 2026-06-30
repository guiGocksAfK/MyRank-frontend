import React, { useState } from 'react';
import { mediaItems, badges } from '../data/mockData';

// ─── helpers ───────────────────────────────────────────────────────────────
const typeIcons = {
  filme:  '🎬',
  jogo:   '🎮',
  serie:  '📺',
  livro:  '📚',
  anime:  '🎌',
  outro:  '📦',
};

function formatTime(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return '0h';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Componente: linha de configuração ────────────────────────────────────
function SettingRow({ label, desc, children }) {
  return (
    <div className="mr-setting-row">
      <div>
        <div className="mr-setting-label">{label}</div>
        {desc && <div className="mr-setting-desc">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Componente: Badge card ───────────────────────────────────────────────
function BadgeCard({ badge }) {
  const pct = Math.min(
    Math.round((badge.progress / badge.maxProgress) * 100),
    100
  );

  return (
    <div className={`mr-badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}>
      <span className="mr-badge-icon">{badge.icon}</span>

      <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 4 }}>
        {badge.name}
      </div>
      <div style={{
        fontSize: '0.6875rem',
        color: 'var(--mr-text-secondary)',
        marginBottom: 10,
        lineHeight: 1.35,
      }}>
        {badge.description}
      </div>

      {badge.unlocked ? (
        <div className="mr-flex mr-items-center mr-justify-center mr-gap-2">
          <div className="mr-dot-green" />
          <span style={{ fontSize: '0.75rem', color: 'var(--mr-green)', fontWeight: 500 }}>
            Desbloqueado
          </span>
        </div>
      ) : (
        <div>
          <div className="mr-flex mr-justify-between mr-mb-1" style={{ fontSize: '0.6875rem' }}>
            <span style={{ color: 'var(--mr-text-secondary)' }}>
              {badge.progress}/{badge.maxProgress}
            </span>
            <span style={{ color: 'var(--mr-text-secondary)' }}>{pct}%</span>
          </div>
          <div className="mr-progress mr-progress-sm">
            <div
              className="mr-progress-bar"
              style={{
                width: `${pct}%`,
                backgroundColor: 'var(--mr-gold)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function ProfileTab({ isDark, onThemeToggle }) {
  const [timeTracking,     setTimeTracking]     = useState(true);
  const [isPublicProfile,  setIsPublicProfile]  = useState(true);
  const [manualHours,      setManualHours]      = useState('');
  const [manualMinutes,    setManualMinutes]     = useState('');
  const [badgeFilter,      setBadgeFilter]      = useState('all'); // 'all' | 'unlocked' | 'locked'

  // ── Stats derivados dos dados ──
  const totalMinutes  = mediaItems.reduce((s, item) => s + (item.timeMinutes ?? 0), 0);
  const totalHours    = Math.round(totalMinutes / 60);
  const avgNote       = (
    mediaItems.reduce((s, item) => s + item.finalNote, 0) / mediaItems.length
  ).toFixed(1);
  const unlockedCount = badges.filter(b => b.unlocked).length;

  // Filtro de badges
  const visibleBadges =
    badgeFilter === 'unlocked' ? badges.filter(b =>  b.unlocked) :
    badgeFilter === 'locked'   ? badges.filter(b => !b.unlocked) :
    badges;

  return (
    <div className="mr-space-y-6">

      {/* ── Header ── */}
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>⚙️ Perfil</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Configurações, conquistas e dados da sua conta
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="mr-stats-grid">
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">🎯</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{mediaItems.length}</div>
          <div className="mr-stat-label">Obras avaliadas</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">⏱️</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{totalHours}h</div>
          <div className="mr-stat-label">Horas consumidas</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">⭐</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{avgNote}</div>
          <div className="mr-stat-label">Nota média</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">🏅</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{unlockedCount}<span style={{ fontSize: '1rem', color: 'var(--mr-text-secondary)', fontWeight: 400 }}>/{badges.length}</span></div>
          <div className="mr-stat-label">Badges desbloqueados</div>
        </div>
      </div>

      {/* ── Layout principal: avatar + settings ── */}
      <div className="mr-profile-grid">

        {/* ── Coluna esquerda: card do perfil ── */}
        <div className="mr-card">
          <div className="mr-card-body mr-text-center mr-space-y-4">

            {/* Avatar */}
            <div className="mr-flex mr-justify-center">
              <div className="mr-avatar-lg">LS</div>
            </div>

            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Lucas Silva</div>
              <div style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
                @lucassilva
              </div>
            </div>

            {/* Mini stats inline */}
            <div className="mr-grid-3col" style={{ textAlign: 'center' }}>
              {[
                { label: 'Obras',      value: mediaItems.length },
                { label: 'Horas',      value: `${totalHours}h`  },
                { label: 'Média',      value: avgNote            },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--mr-gold)' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Badge preview rápido */}
            <div style={{ borderTop: '1px solid var(--mr-border)', paddingTop: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Conquistas
              </div>
              <div className="mr-flex mr-flex-wrap mr-justify-center mr-gap-2">
                {badges.map(badge => (
                  <span
                    key={badge.id}
                    title={badge.name}
                    style={{
                      fontSize: '1.4rem',
                      opacity: badge.unlocked ? 1 : 0.22,
                      filter: badge.unlocked ? 'none' : 'grayscale(100%)',
                      cursor: 'default',
                      lineHeight: 1,
                    }}
                  >
                    {badge.icon}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: 10 }}>
                {unlockedCount} de {badges.length} desbloqueados
              </div>
            </div>

            {/* Visibilidade */}
            <div style={{ borderTop: '1px solid var(--mr-border)', paddingTop: 16 }}>
              <div className="mr-flex mr-items-center mr-justify-between">
                <div style={{ textAlign: 'left' }}>
                  <div className="mr-setting-label">
                    {isPublicProfile ? '🌐 Perfil público' : '🔒 Perfil privado'}
                  </div>
                  <div className="mr-setting-desc">
                    {isPublicProfile
                      ? 'Amigos podem ver seu ranking'
                      : 'Seu ranking está oculto'}
                  </div>
                </div>
                <button
                  className={`mr-switch ${isPublicProfile ? 'checked' : ''}`}
                  onClick={() => setIsPublicProfile(v => !v)}
                >
                  <span className="mr-switch-thumb" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Coluna direita: configurações ── */}
        <div className="mr-space-y-6">

          {/* Aparência (RF-012) */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>🎨 Aparência</h3>
              <SettingRow
                label="Modo escuro"
                desc="Alternar entre tema claro e escuro"
              >
                <button
                  className={`mr-switch ${isDark ? 'checked' : ''}`}
                  onClick={onThemeToggle}
                >
                  <span className="mr-switch-thumb" />
                </button>
              </SettingRow>
            </div>
          </div>

          {/* Rastreamento de Tempo (RF-005 + RF-006) */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>⏱️ Rastreamento de Tempo</h3>

              <SettingRow
                label="Ponderação por tempo"
                desc="Calcular bônus logarítmico automaticamente nas notas finais"
              >
                <button
                  className={`mr-switch ${timeTracking ? 'checked' : ''}`}
                  onClick={() => setTimeTracking(v => !v)}
                >
                  <span className="mr-switch-thumb" />
                </button>
              </SettingRow>

              {/* Fórmula */}
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(201,162,39,0.06)',
                border: '1px solid rgba(201,162,39,0.2)',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--mr-text-secondary)', marginBottom: 6 }}>
                  Fórmula de ponderação (RF-006)
                </div>
                <div className="mr-code mr-code-gold">
                  Nota Final = Nota Original + log₁₀(Minutos / 60)
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-muted)', marginTop: 6 }}>
                  Recompensa obras longas sem punir obras curtas.
                </div>
              </div>

              {/* Entrada manual de tempo */}
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 8 }}>
                  Entrada manual de tempo
                </div>
                <div className="mr-flex mr-items-center mr-gap-2">
                  <input
                    className="mr-time-input"
                    placeholder="HH"
                    value={manualHours}
                    onChange={e => setManualHours(e.target.value)}
                    type="number" min="0"
                  />
                  <span style={{ color: 'var(--mr-text-secondary)' }}>:</span>
                  <input
                    className="mr-time-input"
                    placeholder="mm"
                    value={manualMinutes}
                    onChange={e => setManualMinutes(e.target.value)}
                    type="number" min="0" max="59"
                  />
                  <button className="mr-btn mr-btn-gold mr-btn-sm">Salvar</button>
                </div>
                {(parseInt(manualHours, 10) > 0 || parseInt(manualMinutes, 10) > 0) && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 6 }}>
                    Total: {formatTime(
                      (parseInt(manualHours, 10) || 0) * 60 +
                      (parseInt(manualMinutes, 10) || 0)
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gerenciamento de Imagens (RF-007) */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <div className="mr-flex mr-items-center mr-justify-between">
                <h3 style={{ fontWeight: 700 }}>🖼️ Imagens das Obras</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)' }}>
                  RF-007
                </span>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--mr-text-secondary)' }}>
                Imagens atribuídas automaticamente via API. Clique num poster para trocar.
              </div>

              <div className="mr-flex mr-flex-wrap mr-gap-3">
                {mediaItems.slice(0, 6).map(item => (
                  <div
                    key={item.id}
                    className="mr-poster"
                    style={{ width: 72, cursor: 'pointer' }}
                    title={`${item.title} — clique para trocar`}
                  >
                    <div className="mr-poster-inner" style={{ position: 'relative' }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="mr-poster-placeholder">
                          <span style={{ fontSize: '1.25rem', display: 'block' }}>
                            {typeIcons[item.type] ?? '🎬'}
                          </span>
                        </div>
                      )}
                      <div className="mr-poster-overlay mr-text-center">
                        <span style={{ fontSize: '0.7rem' }}>📷 Trocar</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* APIs Conectadas (RF-009) */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <div className="mr-flex mr-items-center mr-justify-between">
                <h3 style={{ fontWeight: 700 }}>🔌 APIs Conectadas</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)' }}>
                  RF-009
                </span>
              </div>

              {/* Tabela de APIs — mesmo padrão das outras tabelas */}
              <div
                className="mr-table-header"
                style={{ gridTemplateColumns: '28px 1fr 1fr 90px' }}
              >
                <span />
                <span>Serviço</span>
                <span>Cobertura</span>
                <span style={{ textAlign: 'right' }}>Status</span>
              </div>

              {[
                { icon: '🎬', name: 'TMDB',          desc: 'Filmes e Séries',  status: 'Conectado', ok: true  },
                { icon: '🎮', name: 'RAWG',           desc: 'Jogos',            status: 'Conectado', ok: true  },
                { icon: '📚', name: 'Open Library',   desc: 'Livros',           status: 'Conectado', ok: true  },
                { icon: '🤖', name: 'Claude AI',      desc: 'Insights e Análises', status: 'Ativo', ok: true   },
              ].map((api, i) => (
                <div
                  key={i}
                  className="mr-table-row"
                  style={{ gridTemplateColumns: '28px 1fr 1fr 90px' }}
                >
                  <span style={{ fontSize: '1rem' }}>{api.icon}</span>

                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {api.name}
                  </span>

                  <span style={{ fontSize: '0.8125rem', color: 'var(--mr-text-secondary)' }}>
                    {api.desc}
                  </span>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      className={`mr-badge ${api.ok ? 'mr-badge-green' : 'mr-badge-outline'}`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {api.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Badges e Conquistas (RF-012) — largura total ── */}
      <div>
        <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap" style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>🏅 Badges e Conquistas</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--mr-text-muted)', marginRight: 'auto' }}>
            RF-012
          </span>

          {/* Filtro de badges — mesmo padrão toolbar */}
          <div className="mr-flex mr-gap-1">
            {[
              { id: 'all',      label: 'Todos'          },
              { id: 'unlocked', label: '✓ Desbloqueados' },
              { id: 'locked',   label: '🔒 Bloqueados'   },
            ].map(f => (
              <button
                key={f.id}
                className={`mr-btn mr-btn-sm ${badgeFilter === f.id ? 'mr-btn-gold' : 'mr-btn-outline'}`}
                onClick={() => setBadgeFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--mr-text-muted)' }}>
            {visibleBadges.length} de {badges.length}
          </div>
        </div>

        {visibleBadges.length === 0 ? (
          <div className="mr-card">
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
              Nenhum badge encontrado para este filtro. 🔍
            </div>
          </div>
        ) : (
          <div className="mr-badge-grid">
            {visibleBadges.map(badge => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}