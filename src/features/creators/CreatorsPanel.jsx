import React, { useEffect, useState, useMemo } from 'react';
import { getUnifiedWorks } from '../../services/WorkService';
import { mapWorkToItem } from '../../utils/mapWork';
import { useLanguage } from '../../shared/i18n';
import AnimatedNumber from '../rankings/rankings/AnimatedNumber';
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

/** Leque de até 3 pôsteres das obras do criador; cai pras iniciais se não houver imagem. */
function PosterCluster({ works, initials, avatarStyle }) {
  const covers = works.map(w => w.image).filter(Boolean).slice(0, 3);
  if (covers.length === 0) {
    return <div className="mr-avatar-sm" style={avatarStyle} aria-hidden>{initials}</div>;
  }
  return (
    <div style={{ display: 'flex', flexShrink: 0, width: 34 + (covers.length - 1) * 13, height: 51 }} aria-hidden>
      {covers.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          style={{
            width: 34, height: 51, objectFit: 'cover', borderRadius: 5,
            marginLeft: i === 0 ? 0 : -21,
            boxShadow: '0 0 0 2px var(--mr-bg)',
            border: '1px solid var(--mr-border)',
            position: 'relative', zIndex: covers.length - i,
          }}
        />
      ))}
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
  const [useTimeWeight, setUseTimeWeight] = useState(false);

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

  // Escala da barra: teto absoluto (0–10 na média simples, até 12 na ponderada),
  // igual à tabela de rankings. Barra relativa fazia tudo parecer nota máxima.
  const maxNote = useTimeWeight ? 12 : 10;

  // Nota por criador. `raw` = média pura das notas (sempre). `value` = o que é
  // exibido e ordenado: a média pura, ou — com "Ponderação por tempo" ligada —
  // a média das notas ponderada pelas horas investidas + um bônus de volume
  // (log10 do nº de obras, teto +1), pra premiar quem o usuário consumiu mais.
  const VOLUME_BONUS_CAP = 1;
  const creatorScores = useMemo(() => {
    const map = {};
    filteredCreators.forEach(a => {
      const ws = (hasFilters ? a.works.filter(w => matchesFilters(w, filters)) : a.works)
        .filter(w => num(w.note) > 0);
      if (ws.length === 0) { map[a.name] = { raw: 0, value: 0 }; return; }

      const raw = mean(ws.map(w => num(w.note)));

      let value = raw;
      if (useTimeWeight) {
        const totalMin = ws.reduce((s, w) => s + num(w.timeMinutes), 0);
        const timeWeighted = totalMin > 0
          ? ws.reduce((s, w) => s + num(w.note) * num(w.timeMinutes), 0) / totalMin
          : raw;
        const volumeBonus = Math.min(Math.log10(ws.length), VOLUME_BONUS_CAP);
        value = Math.min(timeWeighted + volumeBonus, maxNote);
      }
      map[a.name] = { raw, value };
    });
    return map;
  }, [filteredCreators, useTimeWeight, filters, hasFilters, maxNote]);

  const sorted = useMemo(() => {
    return [...filteredCreators].sort((a, b) => {
      if (sortBy === 'works') return b.count - a.count;
      return (creatorScores[b.name]?.value ?? 0) - (creatorScores[a.name]?.value ?? 0);
    });
  }, [filteredCreators, sortBy, creatorScores]);

  const stats = useMemo(() => {
    const acc = { Diretor: 0, Escritor: 0, Studio: 0, Criador: 0, obras: 0 };
    allCreators.forEach(a => {
      if (acc[a.type] !== undefined) acc[a.type]++;
      acc.obras += a.count;
    });
    return { total: allCreators.length, ...acc };
  }, [allCreators]);

  // Só oferece no filtro os tipos que existem (esconde "Criador" quando vazio, etc).
  const availableTypes = TYPE_OPTIONS.filter(type => (stats[type] ?? 0) > 0);

  const COLS = '44px 1fr 132px 220px 36px';

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
            <p style={{ color: 'var(--mr-text-muted)', fontSize: '0.75rem', marginTop: 4, maxWidth: 620 }}>🔒 {tc.note}</p>
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

      <div style={{ fontSize: '0.8125rem', color: 'var(--mr-text-muted)' }}>
        {[
          `${stats.total} ${tc.statTotal.toLowerCase()}`,
          stats.Diretor > 0 && `${stats.Diretor} ${tc.statDirectors.toLowerCase()}`,
          stats.Escritor > 0 && `${stats.Escritor} ${tc.statWriters.toLowerCase()}`,
          stats.Studio > 0 && `${stats.Studio} ${tc.statStudios.toLowerCase()}`,
        ].filter(Boolean).join('   ·   ')}
      </div>

      <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap">
        <div className="mr-flex mr-gap-2">
          <button className={`mr-btn mr-btn-sm ${sortBy === 'avg' ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setSortBy('avg')}>{tc.sortAvg}</button>
          <button className={`mr-btn mr-btn-sm ${sortBy === 'works' ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setSortBy('works')}>{tc.sortWorks}</button>
        </div>

        <div className="creators-toolbar-divider" />

        <div className="mr-flex mr-gap-1">
          <button className={`mr-btn mr-btn-sm ${selectedTypes.includes('Todos') ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => toggleType('Todos')}>{tc.all}</button>
          {availableTypes.map(type => (
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
                <span>{tc.colAvgRating}</span>
                <span aria-hidden />
              </div>

              {sorted.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>{tc.noneFiltered}</div>
              )}

              {sorted.map((author, i) => {
                const info = getAuthorTypeInfo(author.type);
                const { icon, badgeStyle, avatarStyle } = info;
                const label = tc.typeLabels[author.type] || info.label;
                const rank = i + 1;
                const cScore = creatorScores[author.name] ?? { raw: 0, value: 0 };
                const displayAvg = cScore.value;
                const barWidth = Math.min((displayAvg / maxNote) * 100, 100);
                const barColorClass = getNoteBarColor(displayAvg);
                const rankClass = rank === 1 ? 'mr-rank-number-1' : rank === 2 ? 'mr-rank-number-2' : rank === 3 ? 'mr-rank-number-3' : '';

                const isOpen = expanded.includes(author.name);

                return (
                  <React.Fragment key={author.name}>
                    <div
                      className="mr-table-row mr-rankings-enter"
                      style={{ gridTemplateColumns: COLS, '--rank-delay': `${Math.min(i, 12) * 35}ms`, borderLeft: rank <= 3 ? '3px solid var(--mr-gold)' : undefined }}
                    >
                      <span className={`mr-rank-number ${rankClass}`} style={{ fontSize: '1rem' }}>{rank}</span>

                      <div className="mr-flex mr-items-center mr-gap-3 mr-min-w-0">
                        <PosterCluster works={author.works} initials={getAuthorInitials(author.name)} avatarStyle={avatarStyle} />
                        <div className="mr-min-w-0">
                          <div className="mr-truncate" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{author.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: 1 }}>
                            {author.count} {author.count === 1 ? tc.workOne : tc.workMany}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="mr-badge" style={{ fontSize: '0.7rem', ...badgeStyle }}>{icon} {label}</span>
                      </div>

                      <div className="mr-flex mr-items-center mr-gap-3">
                        <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36, fontSize: '0.9375rem', fontVariantNumeric: 'tabular-nums' }}>
                          <AnimatedNumber value={displayAvg} />
                        </span>
                        <div className="mr-note-bar"><div className={`mr-note-bar-fill ${barColorClass}`} style={{ width: `${barWidth}%` }} /></div>
                      </div>

                      <button
                        onClick={() => setExpanded(prev => prev.includes(author.name) ? prev.filter(x => x !== author.name) : [...prev, author.name])}
                        style={{ background: 'transparent', border: 'none', color: 'var(--mr-text-secondary)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        aria-label={tc.expandWorks}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? '▾' : '▸'}
                      </button>
                    </div>

                    {isOpen && (
                      <div style={{ gridColumn: '1 / -1', padding: '0.5rem 1rem 1rem 1rem' }}>
                        {useTimeWeight && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginBottom: 8 }}>
                            {fmt(tc.realAvg, { avg: cScore.raw.toFixed(1) })} · {author.count} {author.count === 1 ? tc.workOne : tc.workMany}
                          </div>
                        )}
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
                const displayAvg = creatorScores[author.name]?.value ?? 0;
                const barWidth = Math.min((displayAvg / maxNote) * 100, 100);
                const cover = author.works.map(w => w.image).find(Boolean);

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
                      {cover ? (
                        <img src={cover} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '3rem', color: 'var(--mr-text-secondary)' }}>{getAuthorInitials(author.name)}</div>
                      )}
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
