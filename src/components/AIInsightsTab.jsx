import React, { useState } from 'react';
import { badges } from '../data/mockData';

const tasteCategories = [
  { name: 'Ficção Científica', percent: 85, color: 'var(--mr-gold)' },
  { name: 'Thriller', percent: 72, color: 'var(--mr-blue)' },
  { name: 'RPG', percent: 68, color: 'var(--mr-green)' },
  { name: 'Literatura', percent: 45, color: 'var(--mr-purple)' },
  { name: 'Terror', percent: 20, color: 'var(--mr-red)' },
];

const personalityTraits = [
  {
    icon: '🧠',
    label: 'Pensador Analítico',
    description:
      'Você valoriza narrativas complexas e worlds-building detalhado. Suas notas refletem uma apreciação profunda pela construção de universos.',
  },
  {
    icon: '🎯',
    label: 'Seletivo e Rigoroso',
    description:
      'Suas notas tendem a ser mais altas apenas para obras excepcionais. Você não distribui elogios facilmente.',
  },
  {
    icon: '⏳',
    label: 'Apreciador de Investimento',
    description:
      'Obras que exigem mais tempo ganham mais respeito do seu perfil. O bônus de tempo pesa fortemente nas suas avaliações.',
  },
];

export default function AIInsightsTab() {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 2000);
  };

  const compatPercent = 94;
  const circleRadius = 35;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDasharray = `${(compatPercent / 100) * circumference} ${circumference}`;

  return (
    <div className="mr-space-y-6">
      {/* Header */}
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🤖 IA Insights</h1>
        <button
          className="mr-btn mr-btn-gold"
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <>
              <span className="mr-animate-spin">⟳</span> Gerando...
            </>
          ) : (
            '🔄 Regenerar Análise'
          )}
        </button>
      </div>

      {/* Personality Analysis */}
      <div className="mr-info-card-gold">
        <div className="mr-card-body mr-space-y-4">
          <div className="mr-flex mr-items-center mr-gap-3">
            <span style={{ fontSize: '2rem' }}>🧠</span>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                Análise de Personalidade
              </h3>
              <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
                Baseado no seu histórico de avaliações e padrões de consumo, a IA
                identificou o seguinte perfil:
              </p>
            </div>
          </div>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Você é um consumidor sofisticado que valoriza profundidade narrativa e
            complexidade temática. Seu perfil indica uma forte preferência por ficção
            científica e narrativas que desafiam a perspectiva do espectador, com uma
            tendência clara a valorizar obras que demandam maior investimento de tempo.
          </p>

          <div className="mr-grid-3col">
            {personalityTraits.map((trait, i) => (
              <div className="mr-card" key={i}>
                <div className="mr-card-body mr-text-center">
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 8 }}>
                    {trait.icon}
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>
                    {trait.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', lineHeight: 1.4 }}>
                    {trait.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Taste Breakdown */}
      <div className="mr-card">
        <div className="mr-card-body mr-space-y-4">
          <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>📊 Perfil de Gosto</h3>
          <div className="mr-space-y-3">
            {tasteCategories.map((cat) => (
              <div key={cat.name}>
                <div className="mr-flex mr-justify-between mr-mb-2" style={{ fontSize: '0.875rem' }}>
                  <span>{cat.name}</span>
                  <span style={{ fontWeight: 600 }}>{cat.percent}%</span>
                </div>
                <div className="mr-progress">
                  <div
                    className="mr-progress-bar"
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Recommendation */}
      <div className="mr-info-card-green">
        <div className="mr-card-body">
          <div className="mr-flex mr-items-start mr-gap-4">
            <div className="mr-flex-1">
              <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: 8 }}>
                🎯 Próxima Recomendação
              </h3>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--mr-green)', marginBottom: 8 }}>
                Arrival (2016)
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)', lineHeight: 1.6 }}>
                Com base no seu perfil de ficção científica e valorização por narrativas
                complexas, <strong>Arrival</strong> é a recomendação ideal. O filme combina
                todos os elementos que você mais aprecia: ficção científica intelectual,
                narrativa não-linear e profundidade temática. Sua compatibilidade com este
                título é extremamente alta.
              </p>
            </div>
            <div className="mr-compat-circle">
              <svg viewBox="0 0 80 80">
                <circle className="mr-compat-circle-bg" cx="40" cy="40" r={circleRadius} />
                <circle
                  className="mr-compat-circle-fill"
                  cx="40"
                  cy="40"
                  r={circleRadius}
                  strokeDasharray={strokeDasharray}
                />
              </svg>
              <div className="mr-compat-value">{compatPercent}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div>
        <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: 16 }}>
          🏅 Badges e Conquistas
        </h3>
        <div className="mr-badge-grid">
          {badges.map((badge) => (
            <div
              className={`mr-badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
              key={badge.id}
            >
              <span className="mr-badge-icon">{badge.icon}</span>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 4 }}>
                {badge.name}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--mr-text-secondary)',
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}
              >
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
                    <span style={{ color: 'var(--mr-text-secondary)' }}>
                      {Math.round((badge.progress / badge.maxProgress) * 100)}%
                    </span>
                  </div>
                  <div className="mr-progress mr-progress-sm">
                    <div
                      className="mr-progress-bar"
                      style={{
                        width: `${Math.min((badge.progress / badge.maxProgress) * 100, 100)}%`,
                        backgroundColor: 'var(--mr-gold)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
