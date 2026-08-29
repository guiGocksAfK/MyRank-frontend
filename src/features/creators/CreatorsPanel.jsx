import React, { useEffect, useState, useMemo } from 'react';
import { getUnifiedWorks } from '../../services/WorkService';
import { mapWorkToItem } from '../../utils/mapWork';
import { useLanguage } from '../../shared/i18n';
import './creators.css';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

// Ranking de criadores derivado das obras reais do usuário (/works/unified),
// agrupadas por `creator`. Nada de hardcode.

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
  return map[type] ?? { label: type, icon: '👤', badgeStyle: { background: 'var(--mr-muted-bg)', color: 'var(--mr-text-secondary)' }, avatarStyle: { background: 'var(--mr-muted-bg)', color: 'var(--mr-text-secondary)' } };
}

const TYPE_OPTIONS = ['Diretor', 'Escritor', 'Studio', 'Criador'];

/** Infere o "tipo" do criador a partir do nome da categoria da obra. */
function categoryNameToType(categoryName) {
  const s = (categoryName || '').toLowerCase();
  if (/livro|book/.test(s)) return 'Escritor';
  if (/jogo|game/.test(s)) return 'Studio';
  if (/anime/.test(s) && !/s[ée]rie|filme/.test(s)) return 'Studio';
  if (/filme|s[ée]rie|movie|show|\btv\b/.test(s)) return 'Diretor';
  return 'Criador';
}

/** Tipo predominante entre as obras de um criador. */
function dominantType(works) {
  const counts = {};
  works.forEach(w => {
    const t = categoryNameToType(w.categoryName);
    counts[t] = (counts[t] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Criador';
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const mean = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

function getAuthorInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getNoteBarColor(note) {
  if (note >= 10) return 'gold';
  if (note >= 8) return 'green';
  if (note >= 6) return 'yellow';
  return 'red';
}

function getYear(isoDate) {
  if (!isoDate) return null;
  return parseInt(String(isoDate).split('-')[0], 10);
}

function matchesFilters(item, filters) {
  if (!filters || Object.keys(filters).length === 0) return true;
  if (filters.releaseYearMin != null || filters.releaseYearMax != null) {
    const year = getYear(item.releaseDate);
    if (year == null) return false;
    if (filters.releaseYearMin != null && year < filters.releaseYearMin) return false;
    if (filters.releaseYearMax != null && year > filters.releaseYearMax) return false;
  }
  const added = (item.addedDate || '').slice(0, 10); // createdAt ISO → yyyy-MM-dd
  if (filters.addedDateFrom != null && added && added < filters.addedDateFrom) return false;
  if (filters.addedDateTo != null && added && added > filters.addedDateTo) return false;
  return true;
}

function Poster({ src, title, size = 'thumb' }) {
  const dimensions = size === 'thumb' ? { w: 36, h: 54 } : { w: 120, h: 180 };
  if (!src) return (
    <div style={{ width: dimensions.w, height: dimensions.h, borderRadius: 6, background: 'var(--mr-surface)', border: '1px solid var(--mr-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mr-text-secondary)' }}>🎬</div>
  );
  return <img src={src} alt={title} style={{ width: dimensions.w, height: dimensions.h, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--mr-border)' }} />;
}

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

export default function CreatorsTab({ onBack }) {
  const { t } = useLanguage();
  const tc = t.creators;
  const [sortBy, setSortBy] = useState('avg');
  const [selectedTypes, setSelectedTypes] = useState(['Todos']);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [expanded, setExpanded] = useState([]);
  const [useTimeWeight, setUseTimeWeight] = useState(true);

  const [works, setWorks] = useState(null); // obras mapeadas + creator/categoryName; null = carregando

  useEffect(() => {
    let active = true;
    getUnifiedWorks()
      .then((data) => {
        if (!active) return;
        const list = (Array.isArray(data) ? data : []).map((w) => ({
          ...mapWorkToItem(w),
          creator: (w.creator || '').trim(),
          categoryName: w.categoryName,
        }));
        setWorks(list);
      })
      .catch(() => active && setWorks([]));
    return () => { active = false; };
  }, []);

  const loading = works === null;

  // Agrupa por criador
  const allCreators = useMemo(() => {
    if (!works) return [];
    const groups = new Map();
    for (const w of works) {
      if (!w.creator) continue;
      if (!groups.has(w.creator)) groups.set(w.creator, []);
      groups.get(w.creator).push(w);
    }
    return [...groups.entries()].map(([name, ws]) => ({
      name,
      type: dominantType(ws),
      count: ws.length,
      avgNote: mean(ws.map((w) => num(w.note))),
      weightedAvg: mean(ws.map((w) => num(w.finalNote ?? w.note))),
      works: ws,
    }));
  }, [works]);

  const toggleType = (type) => {
    if (type === 'Todos') { setSelectedTypes(['Todos']); return; }
    setSelectedTypes(prev => {
      const base = prev.includes('Todos') ? [] : prev;
      const next = base.includes(type) ? base.filter(x => x !== type) : [...base, type];
      if (next.length === 0 || next.length === TYPE_OPTIONS.length) return ['Todos'];
      return next;
    });
  };

  const hasFilters = Object.keys(filters).length > 0;

  const filteredCreators = useMemo(() => {
    const byType = selectedTypes.includes('Todos')
      ? allCreators
      : allCreators.filter(a => selectedTypes.includes(a.type));
    if (!hasFilters) return byType;
    return byType.filter(a => a.works.some(w => matchesFilters(w, filters)));
  }, [allCreators, selectedTypes, filters, hasFilters]);

  // Média exibida por criador (respeita filtros e ponderação por tempo)
  const creatorAverages = useMemo(() => {
    const map = {};
    filteredCreators.forEach(a => {
      const ws = hasFilters ? a.works.filter(w => matchesFilters(w, filters)) : a.works;
      const notes = ws.map(w => (useTimeWeight ? num(w.finalNote ?? w.note) : num(w.note)));
      map[a.name] = notes.length ? mean(notes) : (useTimeWeight ? a.weightedAvg : a.avgNote);
    });
    return map;
  }, [filteredCreators, useTimeWeight, filters, hasFilters]);

  const sorted = useMemo(() => {
    return [...filteredCreators].sort((a, b) => {
      if (sortBy === 'works') return b.count - a.count;
      return (creatorAverages[b.name] ?? 0) - (creatorAverages[a.name] ?? 0);
    });
  }, [filteredCreators, sortBy, creatorAverages]);

  const maxAvg = useMemo(() => {
    const values = filteredCreators.map(a => creatorAverages[a.name] ?? 0);
    return Math.max(...values, 1);
  }, [filteredCreators, creatorAverages]);

  const stats = useMemo(() => {
    const acc = { Diretor: 0, Escritor: 0, Studio: 0, Criador: 0, obras: 0 };
    allCreators.forEach(a => {
      if (acc[a.type] !== undefined) acc[a.type]++;
      acc.obras += a.count;
    });
    return { total: allCreators.length, ...acc };
  }, [allCreators]);

  const COLS = '44px 1fr 130px 220px 90px';

  return (
    <div className="mr-space-y-6 creators-panel">
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div className="mr-flex mr-items-center mr-gap-3">
          {onBack && (
            <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onBack}>{tc.back}</button>
          )}
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{tc.title}</h1>
            <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>{tc.subtitle}</p>
          </div>
        </div>

        <div className="mr-flex mr-items-center mr-gap-3 mr-flex-wrap">
          <div className="creators-toolbar-divider" />
          <span style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>{tc.timeWeight}</span>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', position: 'relative' }}>
            <input
              type="checkbox"
              checked={useTimeWeight}
              onChange={e => setUseTimeWeight(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <div
              className={`mr-switch ${useTimeWeight ? 'checked' : ''}`}
              role="switch"
              aria-checked={useTimeWeight}
            >
              <span className="mr-switch-thumb" />
            </div>
          </label>
        </div>
      </div>

      <div className="mr-stats-grid">
        <StatCard icon="✨" value={stats.total} label={tc.statTotal} />
        <StatCard icon="🎬" value={stats.Diretor} label={tc.statDirectors} />
        <StatCard icon="✍️" value={stats.Escritor} label={tc.statWriters} />
        <StatCard icon="🏢" value={stats.Studio} label={tc.statStudios} />
      </div>

      <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap">
        <div className="mr-flex mr-gap-2">
          <button className={`mr-btn mr-btn-sm ${sortBy === 'avg' ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setSortBy('avg')}>{tc.sortAvg}</button>
          <button className={`mr-btn mr-btn-sm ${sortBy === 'works' ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setSortBy('works')}>{tc.sortWorks}</button>
        </div>

        <div className="creators-toolbar-divider" />

        <div className="mr-flex mr-gap-1">
          <button className={`mr-btn mr-btn-sm ${selectedTypes.includes('Todos') ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => toggleType('Todos')}>{tc.all}</button>
          {TYPE_OPTIONS.map(type => (
            <button key={type} className={`mr-btn mr-btn-sm ${selectedTypes.includes(type) ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => toggleType(type)}>{tc.typeLabels[type] || type}</button>
          ))}
        </div>

        <div className="creators-toolbar-divider" />

        <div className="mr-flex mr-gap-1">
          <button className={`mr-btn mr-btn-sm ${viewMode === 'list' ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setViewMode('list')} title={tc.viewList}>📋</button>
          <button className={`mr-btn mr-btn-sm ${viewMode === 'grid' ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setViewMode('grid')} title={tc.viewGrid}>🎞️</button>
        </div>

        <div className="creators-toolbar-divider" />
        <button className={`mr-btn mr-btn-sm ${showFilters ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setShowFilters(v => !v)}>{tc.filters}</button>

        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--mr-text-muted)' }}>{fmt(tc.countOfTotal, { n: sorted.length, total: stats.total })}</div>
      </div>

      {showFilters && (
        <div style={{ padding: '1rem', borderRadius: 8, marginBottom: '1rem', background: 'var(--mr-surface)', border: '1px solid var(--mr-border)' }}>
          <div className="mr-flex mr-items-center mr-justify-between mr-mb-3">
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{tc.filters}</span>
          </div>

          <div className="mr-flex mr-flex-wrap mr-gap-4">
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 3 }}>{tc.filterYear}</label>
              <div className="mr-flex mr-items-center mr-gap-1">
                <input type="number" placeholder="1900" value={filters.releaseYearMin ?? ''} onChange={e => setFilters({ ...filters, releaseYearMin: e.target.value ? parseInt(e.target.value, 10) : null })} style={{ width: 80, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--mr-border)', background: 'var(--mr-bg)', color: 'var(--mr-text)', fontSize: '0.8rem' }} />
                <span style={{ color: 'var(--mr-text-secondary)' }}>—</span>
                <input type="number" placeholder="2026" value={filters.releaseYearMax ?? ''} onChange={e => setFilters({ ...filters, releaseYearMax: e.target.value ? parseInt(e.target.value, 10) : null })} style={{ width: 80, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--mr-border)', background: 'var(--mr-bg)', color: 'var(--mr-text)', fontSize: '0.8rem' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 3 }}>{tc.filterAdded}</label>
              <div className="mr-flex mr-items-center mr-gap-1">
                <input type="date" value={filters.addedDateFrom ?? ''} onChange={e => setFilters({ ...filters, addedDateFrom: e.target.value || null })} style={{ width: 130, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--mr-border)', background: 'var(--mr-bg)', color: 'var(--mr-text)', fontSize: '0.8rem' }} />
                <span style={{ color: 'var(--mr-text-secondary)' }}>—</span>
                <input type="date" value={filters.addedDateTo ?? ''} onChange={e => setFilters({ ...filters, addedDateTo: e.target.value || null })} style={{ width: 130, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--mr-border)', background: 'var(--mr-bg)', color: 'var(--mr-text)', fontSize: '0.8rem' }} />
              </div>
            </div>

            <div className="mr-flex mr-items-end">
              <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => setFilters({})}>{tc.filterClear}</button>
            </div>
          </div>
        </div>
      )}

      <div className="mr-card">
        <div className="mr-card-body mr-space-y-2">

          <div style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--mr-gold-subtle, rgba(201,162,39,0.08))', border: '1px solid rgba(201,162,39,0.25)', fontSize: '0.8rem', color: 'var(--mr-text-secondary)', marginBottom: 8 }}>
            <span>🔒</span>
            <span style={{ marginLeft: 8 }}>{tc.note}</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>{tc.loading}</div>
          ) : allCreators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
              {tc.empty1} <strong>{tc.emptyWord}</strong> {tc.empty2}
            </div>
          ) : viewMode === 'list' ? (
            <>
              <div className="mr-table-header" style={{ gridTemplateColumns: COLS }}>
                <span>#</span>
                <span>{tc.colCreator}</span>
                <span>{tc.colType}</span>
                <span style={{ textAlign: 'right' }}>{tc.colAvgRating}</span>
                <span style={{ textAlign: 'right' }}>{tc.colWorks}</span>
              </div>

              {sorted.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>{tc.noneFiltered}</div>
              )}

              {sorted.map((author, i) => {
                const info = getAuthorTypeInfo(author.type);
                const { icon, badgeStyle, avatarStyle } = info;
                const label = tc.typeLabels[author.type] || info.label;
                const rank = i + 1;
                const displayAvg = creatorAverages[author.name] ?? 0;
                const barWidth = Math.min((displayAvg / maxAvg) * 100, 100);
                const barColorClass = getNoteBarColor(displayAvg);
                const rankClass = rank === 1 ? 'mr-rank-number-1' : rank === 2 ? 'mr-rank-number-2' : rank === 3 ? 'mr-rank-number-3' : '';

                return (
                  <React.Fragment key={author.name}>
                    <div className="mr-table-row" style={{ gridTemplateColumns: COLS, borderLeft: rank <= 3 ? '3px solid var(--mr-gold)' : undefined, position: 'relative' }}>
                      <span className={`mr-rank-number ${rankClass}`} style={{ fontSize: '1rem' }}>{rank}</span>

                      <div className="mr-flex mr-items-center mr-gap-3 mr-min-w-0">
                        <div className="mr-avatar-sm" style={avatarStyle} aria-hidden>{getAuthorInitials(author.name)}</div>
                        <div className="mr-min-w-0">
                          <div className="mr-truncate" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{author.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: 1 }}>{icon} {label}</div>
                        </div>
                      </div>

                      <div>
                        <span className="mr-badge" style={{ fontSize: '0.7rem', ...badgeStyle }}>{icon} {label}</span>
                      </div>

                      <div className="mr-flex mr-items-center mr-gap-3">
                        <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36, fontSize: '0.9375rem', fontVariantNumeric: 'tabular-nums' }}>{displayAvg.toFixed(1)}</span>
                        <div className="mr-note-bar"><div className={`mr-note-bar-fill ${barColorClass}`} style={{ width: `${barWidth}%` }} /></div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: 'var(--mr-text)', fontVariantNumeric: 'tabular-nums' }}>{author.count}</span>
                        <span style={{ color: 'var(--mr-text-secondary)', fontSize: '0.75rem', marginLeft: 4 }}>{author.count === 1 ? tc.workOne : tc.workMany}</span>
                      </div>

                      <button onClick={() => setExpanded(prev => prev.includes(author.name) ? prev.filter(x => x !== author.name) : [...prev, author.name])} style={{ position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none', color: 'var(--mr-text-secondary)', cursor: 'pointer' }} aria-label={tc.expandWorks}>
                        {expanded.includes(author.name) ? '▾' : '▸'}
                      </button>
                    </div>

                    {expanded.includes(author.name) && (
                      <div style={{ gridColumn: '1 / -1', padding: '0.5rem 1rem 1rem 1rem' }}>
                        <div className="mr-flex mr-flex-col mr-gap-2">
                          {author.works
                            .filter(w => matchesFilters(w, filters))
                            .sort((a, b) => {
                              const na = useTimeWeight ? num(a.finalNote ?? a.note) : num(a.note);
                              const nb = useTimeWeight ? num(b.finalNote ?? b.note) : num(b.note);
                              return nb - na;
                            })
                            .map(work => {
                              const displayWorkNote = useTimeWeight ? num(work.finalNote ?? work.note) : num(work.note);
                              return (
                              <div key={work.id} className="mr-flex mr-items-center mr-justify-between" style={{ padding: '8px', borderRadius: 8, background: 'var(--mr-bg)', border: '1px solid var(--mr-border)' }}>
                                <div className="mr-flex mr-items-center mr-gap-3">
                                  <Poster src={work.image} title={work.title} />
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{work.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>{work.creator || work.categoryName}</div>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--mr-gold)' }}>{displayWorkNote.toFixed(1)}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>{num(work.note).toFixed(1)} • {Math.round((work.timeMinutes || 0) / 60)}h</div>
                                </div>
                              </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                  </React.Fragment>
                );
              })}
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {sorted.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>{tc.noneFiltered}</div>
              ) : sorted.map((author, i) => {
                const info = getAuthorTypeInfo(author.type);
                const { icon } = info;
                const label = tc.typeLabels[author.type] || info.label;
                const displayAvg = creatorAverages[author.name] ?? 0;
                const barWidth = Math.min((displayAvg / maxAvg) * 100, 100);

                return (
                  <div
                    key={author.name}
                    style={{
                      position: 'relative', borderRadius: 8, overflow: 'hidden',
                      border: i < 3 ? '2px solid var(--mr-gold)' : '1px solid var(--mr-border)',
                      background: 'var(--mr-surface)', cursor: 'default',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ position: 'relative', aspectRatio: '2 / 3', background: 'var(--mr-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '3rem', color: 'var(--mr-text-secondary)' }}>{getAuthorInitials(author.name)}</div>
                      <div style={{ position: 'absolute', top: 6, left: 6, background: i < 3 ? 'var(--mr-gold)' : 'rgba(0,0,0,0.7)', color: i < 3 ? '#000' : '#fff', fontWeight: 700, fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12 }}>
                        #{i + 1}
                      </div>
                      <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.85)', color: 'var(--mr-gold)', fontWeight: 700, fontSize: '0.9rem', padding: '3px 8px', borderRadius: 6 }}>
                        {displayAvg.toFixed(1)}
                      </div>
                    </div>

                    <div style={{ padding: '10px' }}>
                      <div className="mr-truncate" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>{author.name}</div>
                      <div className="mr-truncate" style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginBottom: 8 }}>{icon} {label}</div>

                      <div className="mr-note-bar" style={{ height: 4 }}>
                        <div className={`mr-note-bar-fill ${getNoteBarColor(displayAvg)}`} style={{ width: `${barWidth}%` }} />
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', marginTop: 8 }}>
                        {author.count} {author.count === 1 ? tc.workOne : tc.workMany}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
