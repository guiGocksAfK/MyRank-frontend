import React, { useState, useMemo } from 'react';
import { authorRankings } from '../data/mockData';

// ─── helpers ───────────────────────────────────────────────────────────────
function getAuthorTypeInfo(type) {
  const map = {
    Diretor: {
      label: 'Diretor', icon: '🎬',
      badgeStyle: { background: 'var(--mr-gold-10)', color: 'var(--mr-gold)' },
      avatarStyle: { background: 'var(--mr-gold-20)', color: 'var(--mr-gold)' },
    },
    Escritor: {
      label: 'Escritor', icon: '✍️',
      badgeStyle: { background: 'var(--mr-blue-20)', color: 'var(--mr-blue-light)' },
      avatarStyle: { background: 'var(--mr-blue-20)', color: 'var(--mr-blue-light)' },
    },
    Studio: {
      label: 'Studio', icon: '🏢',
      badgeStyle: { background: 'rgba(196, 181, 253, 0.15)', color: 'var(--mr-purple)' },
      avatarStyle: { background: 'rgba(196, 181, 253, 0.18)', color: 'var(--mr-purple)' },
    },
  };
  return map[type] ?? {
    label: type, icon: '👤',
    badgeStyle: { background: 'var(--mr-muted-bg)', color: 'var(--mr-text-secondary)' },
    avatarStyle: { background: 'var(--mr-muted-bg)', color: 'var(--mr-text-secondary)' },
  };
}

function getAuthorInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getNoteBarColor(note) {
  if (note >= 10) return 'gold';
  if (note >= 8)  return 'green';
  if (note >= 6)  return 'yellow';
  return 'red';
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function CreatorsTab({ onBack }) {
  const [sortBy,        setSortBy]        = useState('avg');
  const [selectedTypes, setSelectedTypes] = useState(['Todos']);
  const [showWeights, setShowWeights] = useState(true);

  const typeOptions = ['Diretor', 'Escritor', 'Studio'];

  const toggleType = (type) => {
    if (type === 'Todos') {
      setSelectedTypes(['Todos']);
      return;
    }
    setSelectedTypes(prev => {
      const current = prev.includes('Todos') ? [] : prev;
      const next = current.includes(type)
        ? current.filter(item => item !== type)
        : [...current, type];
      if (next.length === 0 || next.length === typeOptions.length) return ['Todos'];
      return next;
    });
  };

  const sorted = useMemo(() => {
    const filtered = selectedTypes.includes('Todos')
      ? [...authorRankings]
      : authorRankings.filter(a => selectedTypes.includes(a.type));
    return filtered.sort((a, b) =>
      sortBy === 'works' ? b.count - a.count : b.avgNote - a.avgNote
    );
  }, [sortBy, selectedTypes]);

  const maxAvg = useMemo(
    () => Math.max(...authorRankings.map(a => a.avgNote), 1),
    []
  );

  const stats = useMemo(() => {
    const acc = { Diretor: 0, Escritor: 0, Studio: 0, obras: 0, somaNotas: 0 };
    authorRankings.forEach(a => {
      if (acc[a.type] !== undefined) acc[a.type]++;
      acc.obras += a.count;
      acc.somaNotas += a.avgNote;
    });
    return {
      total: authorRankings.length,
      ...acc,
      mediaGeral: authorRankings.length ? (acc.somaNotas / authorRankings.length) : 0,
    };
  }, []);

  const COLS = '44px 1fr 130px 220px 90px';

  return (
    <div className="mr-space-y-6">

      {/* ── Header ── */}
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div className="mr-flex mr-items-center mr-gap-3">
          {onBack && (
            <button
              className="mr-btn mr-btn-outline mr-btn-sm"
              onClick={onBack}
              title="Voltar aos rankings"
            >
              ← Voltar
            </button>
          )}
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>✨ Ranking de Criadores</h1>
            <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
              Diretores, escritores e studios — ranqueados pelas suas avaliações
            </p>
          </div>
        </div>

        <div className="mr-flex mr-items-center mr-gap-3 mr-flex-wrap">
          {onBack && (
            <button
              className="mr-btn mr-btn-outline"
              onClick={onBack}
            >
              🏆 Ver rankings →
            </button>
          )}

          <div style={{ width: 1, height: 24, background: 'var(--mr-border)' }} />

          <span style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>Ponderação por tempo</span>
          <button className={`mr-switch ${showWeights ? 'checked' : ''}`} onClick={() => setShowWeights(v => !v)}>
            <span className="mr-switch-thumb" />
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="mr-stats-grid">
        <StatCard icon="✨" value={stats.total}   label="Criadores no total" />
        <StatCard icon="🎬" value={stats.Diretor}  label="Diretores" />
        <StatCard icon="✍️" value={stats.Escritor} label="Escritores" />
        <StatCard icon="🏢" value={stats.Studio}   label="Studios" />
      </div>

      {/* ── Toolbar: igual ao RankingsTab — botões soltos, sem mr-card wrapper ── */}
      <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap">

        {/* Ordenação */}
        <div className="mr-flex mr-gap-2">
          <button
            className={`mr-btn mr-btn-sm ${sortBy === 'avg' ? 'mr-btn-gold' : 'mr-btn-outline'}`}
            onClick={() => setSortBy('avg')}
          >
            Média
          </button>
          <button
            className={`mr-btn mr-btn-sm ${sortBy === 'works' ? 'mr-btn-gold' : 'mr-btn-outline'}`}
            onClick={() => setSortBy('works')}
          >
            Nº de obras
          </button>
        </div>

        {/* Separador vertical */}
        <div style={{ width: 1, height: 24, background: 'var(--mr-border)' }} />

        {/* Filtro por tipo */}
        <div className="mr-flex mr-gap-1">
          <button
            className={`mr-btn mr-btn-sm ${selectedTypes.includes('Todos') ? 'mr-btn-gold' : 'mr-btn-outline'}`}
            onClick={() => toggleType('Todos')}
          >
            Todos
          </button>
          {typeOptions.map(type => (
            <button
              key={type}
              className={`mr-btn mr-btn-sm ${selectedTypes.includes(type) ? 'mr-btn-gold' : 'mr-btn-outline'}`}
              onClick={() => toggleType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Contador — alinhado à direita, igual ao RankingsTab */}
        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--mr-text-muted)' }}>
          {sorted.length} de {stats.total} criadores
        </div>
      </div>

      {/* ── Tabela principal ── */}
      <div className="mr-card">
        <div className="mr-card-body mr-space-y-2">

          <div className="mr-table-header" style={{ gridTemplateColumns: COLS }}>
            <span>#</span>
            <span>Criador</span>
            <span>Tipo</span>
            <span style={{ textAlign: 'right' }}>Avaliação média</span>
            <span style={{ textAlign: 'right' }}>Obras</span>
          </div>

          {sorted.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '2.5rem 1rem',
              color: 'var(--mr-text-secondary)', fontSize: '0.875rem',
            }}>
              Nenhum criador encontrado para este filtro. 🔍
            </div>
          )}

          {sorted.map((author, i) => {
            const { label, icon, badgeStyle, avatarStyle } = getAuthorTypeInfo(author.type);
            const rank = i + 1;
            const barWidth = Math.min((author.avgNote / maxAvg) * 100, 100);
            const barColorClass = getNoteBarColor(author.avgNote);

            const rankClass =
              rank === 1 ? 'mr-rank-number-1' :
              rank === 2 ? 'mr-rank-number-2' :
              rank === 3 ? 'mr-rank-number-3' : '';

            return (
              <div
                key={author.name}
                className="mr-table-row"
                style={{
                  gridTemplateColumns: COLS,
                  borderLeft: rank <= 3 ? '3px solid var(--mr-gold)' : undefined,
                }}
              >
                <span
                  className={`mr-rank-number ${rankClass}`}
                  style={{ fontSize: '1rem' }}
                >
                  {rank}
                </span>

                <div className="mr-flex mr-items-center mr-gap-3 mr-min-w-0">
                  <div className="mr-avatar-sm" style={avatarStyle} aria-hidden>
                    {getAuthorInitials(author.name)}
                  </div>
                  <div className="mr-min-w-0">
                    <div className="mr-truncate" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                      {author.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: 1 }}>
                      {icon} {label}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="mr-badge" style={{ fontSize: '0.7rem', ...badgeStyle }}>
                    {icon} {label}
                  </span>
                </div>

                <div className="mr-flex mr-items-center mr-gap-3">
                  <span style={{
                    fontWeight: 700,
                    color: 'var(--mr-gold)',
                    minWidth: 36,
                    fontSize: '0.9375rem',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {author.avgNote.toFixed(1)}
                  </span>
                  <div className="mr-note-bar">
                    <div
                      className={`mr-note-bar-fill ${barColorClass}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontWeight: 700,
                    color: 'var(--mr-text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {author.count}
                  </span>
                  <span style={{
                    color: 'var(--mr-text-secondary)',
                    fontSize: '0.75rem',
                    marginLeft: 4,
                  }}>
                    {author.count === 1 ? 'obra' : 'obras'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ─── StatCard interno ──────────────────────────────────────────────────────
function StatCard({ icon, value, label }) {
  return (
    <div className="mr-stat-card">
      <div className="mr-stat-icon-row">
        <span className="mr-stat-icon">{icon}</span>
        <span className="mr-stat-dot" />
      </div>
      <div className="mr-stat-value">{value}</div>
      <div className="mr-stat-label">{label}</div>
    </div>
  );
}