import React, { useState } from 'react';
import { mediaItems, badges } from '../data/mockData';

const typeIcons = {
  filme: '🎬',
  jogo: '🎮',
  serie: '📺',
  livro: '📚',
};

export default function ProfileTab({ isDark, onThemeToggle }) {
  const [timeTracking, setTimeTracking] = useState(true);
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');

  const totalHours = Math.round(
    mediaItems.reduce((sum, item) => sum + item.timeMinutes, 0) / 60
  );
  const avgNote = (
    mediaItems.reduce((sum, item) => sum + item.finalNote, 0) / mediaItems.length
  ).toFixed(1);
  const unlockedBadges = badges.filter((b) => b.unlocked).length;

  const profileStats = [
    { label: 'Obras', value: mediaItems.length },
    { label: 'Horas', value: `${totalHours}h` },
    { label: 'Nota Média', value: avgNote },
  ];

  return (
    <div className="mr-space-y-6">
      {/* Header */}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>⚙️ Perfil</h1>

      <div className="mr-profile-grid">
        {/* Left - Profile Card */}
        <div className="mr-card">
          <div className="mr-card-body mr-text-center mr-space-y-4">
            <div className="mr-flex mr-justify-center">
              <div className="mr-avatar-lg">LS</div>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Lucas Silva</div>
              <div style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
                @lucassilva
              </div>
            </div>

            <div className="mr-grid-3col">
              {profileStats.map((stat, i) => (
                <div key={i}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--mr-gold)' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>
                Badges ({unlockedBadges}/{badges.length})
              </div>
              <div className="mr-flex mr-flex-wrap mr-justify-center mr-gap-3">
                {badges.map((badge) => (
                  <span
                    key={badge.id}
                    style={{
                      fontSize: '1.5rem',
                      opacity: badge.unlocked ? 1 : 0.3,
                      filter: badge.unlocked ? 'none' : 'grayscale(100%)',
                    }}
                    title={badge.name}
                  >
                    {badge.icon}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right - Settings */}
        <div className="mr-space-y-6">
          {/* Appearance */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>🎨 Aparência</h3>
              <div className="mr-setting-row">
                <div>
                  <div className="mr-setting-label">Modo escuro</div>
                  <div className="mr-setting-desc">
                    Alternar entre tema claro e escuro
                  </div>
                </div>
                <button
                  className={`mr-switch ${isDark ? 'checked' : ''}`}
                  onClick={onThemeToggle}
                >
                  <span className="mr-switch-thumb" />
                </button>
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>⏱️ Rastreamento de Tempo</h3>
              <div className="mr-setting-row">
                <div>
                  <div className="mr-setting-label">Rastreamento automático</div>
                  <div className="mr-setting-desc">
                    Calcular bônus de tempo automaticamente
                  </div>
                </div>
                <button
                  className={`mr-switch ${timeTracking ? 'checked' : ''}`}
                  onClick={() => setTimeTracking(!timeTracking)}
                >
                  <span className="mr-switch-thumb" />
                </button>
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--mr-radius-sm)',
                  backgroundColor: 'rgba(30, 30, 30, 0.3)',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4 }}>
                  Fórmula de ponderação
                </div>
                <div className="mr-code mr-code-gold">
                  Nota Final = Nota Original + log₁₀(Tempo / 60min)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 8 }}>
                  Entrada manual de tempo
                </div>
                <div className="mr-flex mr-items-center mr-gap-2">
                  <input
                    className="mr-time-input"
                    placeholder="HH"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                  />
                  <span style={{ color: 'var(--mr-text-secondary)' }}>:</span>
                  <input
                    className="mr-time-input"
                    placeholder="mm"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                  />
                  <button className="mr-btn mr-btn-gold mr-btn-sm">Salvar</button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>🔒 Privacidade</h3>
              <div className="mr-setting-row">
                <div>
                  <div className="mr-setting-label">Perfil público</div>
                  <div className="mr-setting-desc">
                    Permitir que outros vejam seu ranking e perfil
                  </div>
                </div>
                <button
                  className={`mr-switch ${isPublicProfile ? 'checked' : ''}`}
                  onClick={() => setIsPublicProfile(!isPublicProfile)}
                >
                  <span className="mr-switch-thumb" />
                </button>
              </div>
            </div>
          </div>

          {/* Image Management */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>🖼️ Gerenciamento de Imagens</h3>
              <div style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)', marginBottom: 8 }}>
                Clique em uma imagem para trocar o poster
              </div>
              <div className="mr-flex mr-flex-wrap mr-gap-3">
                {mediaItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="mr-poster"
                    style={{ width: 80 }}
                  >
                    <div
                      className="mr-poster-inner"
                      style={{ position: 'relative' }}
                    >
                      <div className="mr-poster-placeholder">
                        <span style={{ fontSize: '1.25rem', display: 'block' }}>
                          {typeIcons[item.type]}
                        </span>
                      </div>
                      <div className="mr-poster-overlay mr-text-center">
                        <span style={{ fontSize: '0.75rem' }}>📷 Trocar</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* API Info */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>🔌 APIs Utilizadas</h3>
              <div className="mr-grid-2col">
                <div className="mr-setting-row mr-flex-col mr-items-start" style={{ gap: 4 }}>
                  <div className="mr-flex mr-items-center mr-gap-2">
                    <span>🎬</span>
                    <span className="mr-setting-label">TMDB</span>
                  </div>
                  <div className="mr-setting-desc">The Movie Database — Filmes e Séries</div>
                  <span className="mr-badge mr-badge-green">Conectado</span>
                </div>

                <div className="mr-setting-row mr-flex-col mr-items-start" style={{ gap: 4 }}>
                  <div className="mr-flex mr-items-center mr-gap-2">
                    <span>🎮</span>
                    <span className="mr-setting-label">RAWG</span>
                  </div>
                  <div className="mr-setting-desc">RAWG Video Games Database — Jogos</div>
                  <span className="mr-badge mr-badge-green">Conectado</span>
                </div>

                <div className="mr-setting-row mr-flex-col mr-items-start" style={{ gap: 4 }}>
                  <div className="mr-flex mr-items-center mr-gap-2">
                    <span>📚</span>
                    <span className="mr-setting-label">Open Library</span>
                  </div>
                  <div className="mr-setting-desc">Open Library — Livros</div>
                  <span className="mr-badge mr-badge-green">Conectado</span>
                </div>

                <div className="mr-setting-row mr-flex-col mr-items-start" style={{ gap: 4 }}>
                  <div className="mr-flex mr-items-center mr-gap-2">
                    <span>🤖</span>
                    <span className="mr-setting-label">IA LLM</span>
                  </div>
                  <div className="mr-setting-desc">Modelo de Linguagem — Insights e Análises</div>
                  <span className="mr-badge mr-badge-gold">Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
