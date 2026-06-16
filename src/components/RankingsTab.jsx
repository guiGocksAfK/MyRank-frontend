import React, { useState } from 'react';
import { mediaItems, authorRankings } from '../data/mockData';

const typeTabs = [
  { id: 'all', label: '🌟 Todos' },
  { id: 'filme', label: '🎬 Filmes' },
  { id: 'jogo', label: '🎮 Jogos' },
  { id: 'serie', label: '📺 Séries' },
  { id: 'livro', label: '📚 Livros' },
];

const typeLabels = {
  filme: 'Filme',
  jogo: 'Jogo',
  serie: 'Série',
  livro: 'Livro',
};

function getNoteBarColor(note) {
  if (note >= 10) return 'gold';
  if (note >= 8) return 'green';
  if (note >= 6) return 'yellow';
  return 'red';
}

function getAuthorTypeBadge(type) {
  const map = {
    Diretor: '🎬 Diretor',
    Escritor: '✍️ Escritor',
    Studio: '🏢 Studio',
  };
  return map[type] || type;
}

export default function RankingsTab() {
  const [activeType, setActiveType] = useState('all');
  const [useTimeWeight, setUseTimeWeight] = useState(true);
  const [unifiedRanking, setUnifiedRanking] = useState(false);
  const [sortBy, setSortBy] = useState('finalNote');

  let filtered = activeType === 'all'
    ? [...mediaItems]
    : mediaItems.filter((item) => item.type === activeType);

  const sortKey = useTimeWeight
    ? sortBy === 'finalNote'
      ? 'finalNote'
      : sortBy === 'originalNote'
      ? 'note'
      : 'timeMinutes'
    : sortBy === 'finalNote'
    ? 'note'
    : sortBy === 'originalNote'
    ? 'note'
    : 'timeMinutes';

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'time') return b.timeMinutes - a.timeMinutes;
    return b[sortKey] - a[sortKey];
  });

  const maxNote = useTimeWeight ? 12 : 10;

  return (
    <div className="mr-space-y-6">
      {/* Header */}
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🏆 Rankings</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Compare e analise suas avaliações
          </p>
        </div>
        <div className="mr-flex mr-items-center mr-gap-3">
          <span style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>
            Ponderação por tempo
          </span>
          <button
            className={`mr-switch ${useTimeWeight ? 'checked' : ''}`}
            onClick={() => setUseTimeWeight(!useTimeWeight)}
          >
            <span className="mr-switch-thumb" />
          </button>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="mr-flex mr-items-center mr-gap-4 mr-flex-wrap">
        <div className="mr-tabs-list">
          {typeTabs.map((tab) => (
            <button
              key={tab.id}
              className={`mr-tab-trigger ${activeType === tab.id ? 'active' : ''}`}
              onClick={() => setActiveType(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          className={unifiedRanking ? 'mr-btn mr-btn-gold mr-btn-sm' : 'mr-btn mr-btn-outline mr-btn-sm'}
          onClick={() => setUnifiedRanking(!unifiedRanking)}
        >
          🔗 Unificar Rankings
        </button>
      </div>

      {/* Sort Buttons */}
      <div className="mr-flex mr-gap-2 mr-flex-wrap">
        {[
          { key: 'finalNote', label: useTimeWeight ? 'Nota Final' : 'Nota' },
          { key: 'originalNote', label: 'Nota Original' },
          { key: 'time', label: 'Tempo' },
        ].map((s) => (
          <button
            key={s.key}
            className={`mr-btn mr-btn-sm ${sortBy === s.key ? 'mr-btn-gold' : 'mr-btn-outline'}`}
            onClick={() => setSortBy(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="mr-table-header">
        <span>#</span>
        <span>Título</span>
        <span>Tipo</span>
        <span>Nota</span>
        <span>Bônus</span>
        <span>Nota Final</span>
      </div>

      {/* Table Rows */}
      <div className="mr-space-y-2">
        {sorted.map((item, i) => {
          const displayNote = useTimeWeight ? item.finalNote : item.note;
          const bonus = useTimeWeight ? item.bonusTime : 0;
          const barColor = getNoteBarColor(displayNote);
          const barWidth = Math.min((displayNote / maxNote) * 100, 100);

          return (
            <div className="mr-table-row" key={item.id}>
              <span style={{ fontWeight: 700, color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-secondary)' }}>
                {i + 1}
              </span>
              <div className="mr-min-w-0">
                <div className="mr-truncate" style={{ fontWeight: 500 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
                  {item.director || item.author || item.studio || ''}
                </div>
              </div>
              <span className="mr-badge mr-badge-outline">{typeLabels[item.type]}</span>
              <span style={{ fontWeight: 600 }}>{item.note.toFixed(1)}</span>
              <span style={{ color: 'var(--mr-blue-light)', fontWeight: 500, fontSize: '0.875rem' }}>
                {bonus > 0 ? `+${bonus.toFixed(1)}` : '—'}
              </span>
              <div className="mr-flex mr-items-center mr-gap-3">
                <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36 }}>
                  {displayNote.toFixed(1)}
                </span>
                <div className="mr-note-bar">
                  <div
                    className={`mr-note-bar-fill ${barColor}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Author Rankings */}
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 16 }}>
          👤 Ranking de Autores/Diretores
        </h2>
        <div className="mr-author-grid">
          {authorRankings.map((author, i) => (
            <div className="mr-author-card" key={i}>
              <div className="mr-flex mr-items-center mr-gap-3">
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-secondary)',
                    width: 28,
                  }}
                >
                  {i + 1}
                </span>
                <div className="mr-flex-1">
                  <div style={{ fontWeight: 600 }}>{author.name}</div>
                  <span className="mr-badge mr-badge-outline mr-mt-2">
                    {getAuthorTypeBadge(author.type)}
                  </span>
                </div>
              </div>
              <div className="mr-author-stats">
                <div>
                  <div className="mr-author-stat-label">Média</div>
                  <div className="mr-author-stat-value" style={{ color: 'var(--mr-gold)' }}>
                    {author.avgNote.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="mr-author-stat-label">Simples</div>
                  <div className="mr-author-stat-value">{author.avgNote.toFixed(1)}</div>
                </div>
                <div>
                  <div className="mr-author-stat-label">Ponderada</div>
                  <div className="mr-author-stat-value" style={{ color: 'var(--mr-blue-light)' }}>
                    {author.weightedAvg.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="mr-author-stat-label">Obras</div>
                  <div className="mr-author-stat-value">{author.count}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gold Info Card - Formulas */}
      <div className="mr-info-card-gold">
        <div className="mr-card-body mr-flex mr-items-start mr-gap-4">
          <span style={{ fontSize: '1.5rem' }}>📜</span>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Fórmulas de Cálculo</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>
              <div style={{ marginBottom: 4 }}>
                <span className="mr-code mr-code-gold">
                  Nota Final = Nota Original + log₁₀(Tempo / 60min)
                </span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <span className="mr-code mr-code-blue">
                  Média Ponderada = Σ(nota × tempo) / Σ(tempo)
                </span>
              </div>
              <div>
                O bônus de tempo recompensa obras que exigem maior investimento,
                enquanto a média ponderada considera o tempo como peso na média dos autores.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
