import React, { useState, useMemo } from 'react';
import {
  authorRankings,
  calculateFinalNote,
  INITIAL_TABLES,
  fetchMetadataSuggestion,
} from '../data/mockData';

// ─── helpers ───────────────────────────────────────────────────────────────
function getNoteBarColor(note) {
  if (note >= 10) return 'gold';
  if (note >= 8)  return 'green';
  if (note >= 6)  return 'yellow';
  return 'red';
}

function getAuthorTypeBadge(type) {
  const map = { Diretor: '🎬 Diretor', Escritor: '✍️ Escritor', Studio: '🏢 Studio' };
  return map[type] || type;
}

// Formata minutos → "2h 30min" / "45min" / "50h 0min"
function formatTime(minutes) {
  if (!minutes || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// Converte minutos → { hours, mins } para o input HH:mm
function minutesToHHMM(minutes) {
  if (!minutes || minutes <= 0) return { hours: '', mins: '' };
  return {
    hours: Math.floor(minutes / 60),
    mins:  minutes % 60,
  };
}

// Extrai ano de uma data ISO
function getYear(isoDate) {
  if (!isoDate) return null;
  return parseInt(isoDate.split('-')[0], 10);
}

function sortItems(items, sortBy, useTimeWeight) {
  return [...items].sort((a, b) => {
    if (sortBy === 'time') return b.timeMinutes - a.timeMinutes;
    return useTimeWeight ? b.finalNote - a.finalNote : b.note - a.note;
  });
}

function getMode(sortBy, useTimeWeight) {
  if (sortBy === 'time') return 'time';
  return useTimeWeight ? 'weight' : 'simple';
}

// Aplica filtros aos items (releaseDate, addedDate)
function applyFilters(items, filters) {
  if (!filters) return items;
  return items.filter(item => {
    if (filters.releaseYearMin != null || filters.releaseYearMax != null) {
      const year = getYear(item.releaseDate);
      if (year == null) return false;
      if (filters.releaseYearMin != null && year < filters.releaseYearMin) return false;
      if (filters.releaseYearMax != null && year > filters.releaseYearMax) return false;
    }
    if (filters.addedDateFrom != null) {
      if (item.addedDate < filters.addedDateFrom) return false;
    }
    if (filters.addedDateTo != null) {
      if (item.addedDate > filters.addedDateTo) return false;
    }
    return true;
  });
}

// Larguras FIXAS para alinhamento entre .mr-table-header e .mr-table-row
function getColumnConfig(mode, withActions = false, hasImage = false) {
  const showTableCol = !withActions;
  const imgCol = hasImage ? ['40px'] : [];
  const imgHeader = hasImage ? [''] : [];

  if (mode === 'weight') {
    const grid = ['2rem', ...imgCol, '1fr'];
    const headers = ['#', ...imgHeader, 'Título'];
    if (showTableCol) { grid.push('120px'); headers.push('Tabela'); }
    grid.push('70px', '70px', '140px');
    headers.push('Nota', 'Bônus', 'Nota Final');
    if (withActions) { grid.push('80px'); headers.push('Ações'); }
    return { gridTemplate: grid.join(' '), headers };
  }
  if (mode === 'time') {
    const grid = ['2rem', ...imgCol, '1fr'];
    const headers = ['#', ...imgHeader, 'Título'];
    if (showTableCol) { grid.push('120px'); headers.push('Tabela'); }
    grid.push('70px', '110px');
    headers.push('Nota', 'Tempo');
    if (withActions) { grid.push('80px'); headers.push('Ações'); }
    return { gridTemplate: grid.join(' '), headers };
  }
  // simple
  const grid = ['2rem', ...imgCol, '1fr'];
  const headers = ['#', ...imgHeader, 'Título'];
  if (showTableCol) { grid.push('120px'); headers.push('Tabela'); }
  grid.push('180px');
  headers.push('Nota');
  if (withActions) { grid.push('80px'); headers.push('Ações'); }
  return { gridTemplate: grid.join(' '), headers };
}

const badgeStyle = {
  fontSize: '0.7rem',
  width: 'fit-content',
  whiteSpace: 'nowrap',
};

// ─── Componente: Poster (imagem ou placeholder) ───────────────────────────
function Poster({ src, title, size = 'thumb' }) {
  const dimensions = size === 'thumb' ? { w: 36, h: 54 } : { w: 200, h: 300 };
  const placeholder = (
    <div style={{
      width: dimensions.w, height: dimensions.h,
      borderRadius: size === 'thumb' ? 4 : 8,
      background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size === 'thumb' ? '1rem' : '3rem',
      color: 'var(--mr-text-secondary)',
    }}>🎬</div>
  );

  if (!src) return placeholder;

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
      style={{
        width: dimensions.w, height: dimensions.h,
        borderRadius: size === 'thumb' ? 4 : 8,
        objectFit: 'cover', border: '1px solid var(--mr-border)',
      }}
    />
  );
}

// ─── Componente: Card do Grid (estilo Netflix) ────────────────────────────
function GridCard({ item, mode, maxNote, index, onEdit, onDelete, showActions }) {
  const displayNote = mode === 'weight' ? item.finalNote : item.note;
  const bonus = mode === 'weight' ? item.bonusTime : 0;
  const barWidth = Math.min((displayNote / maxNote) * 100, 100);

  return (
    <div style={{
      position: 'relative', borderRadius: 8, overflow: 'hidden',
      border: index < 3 ? '2px solid var(--mr-gold)' : '1px solid var(--mr-border)',
      background: 'var(--mr-surface)', cursor: showActions ? 'pointer' : 'default',
      transition: 'transform 0.15s ease',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ position: 'relative', aspectRatio: '2 / 3', background: 'var(--mr-bg)' }}>
        {item.image ? (
          <img
            src={item.image} alt={item.title} loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', color: 'var(--mr-text-secondary)',
          }}>🎬</div>
        )}

        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: index < 3 ? 'var(--mr-gold)' : 'rgba(0,0,0,0.7)',
          color: index < 3 ? '#000' : '#fff',
          fontWeight: 700, fontSize: '0.75rem',
          padding: '2px 8px', borderRadius: 12,
        }}>
          #{index + 1}
        </div>

        <div style={{
          position: 'absolute', bottom: 6, right: 6,
          background: 'rgba(0,0,0,0.85)',
          color: 'var(--mr-gold)',
          fontWeight: 700, fontSize: '0.9rem',
          padding: '3px 8px', borderRadius: 6,
        }}>
          {displayNote.toFixed(1)}
        </div>
      </div>

      <div style={{ padding: '8px 10px' }}>
        <div className="mr-truncate" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>
          {item.title}
        </div>
        <div className="mr-truncate" style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginBottom: 6 }}>
          {item.sub}
        </div>

        <div className="mr-note-bar" style={{ height: 4 }}>
          <div className={`mr-note-bar-fill ${getNoteBarColor(displayNote)}`} style={{ width: `${barWidth}%` }} />
        </div>

        {mode === 'weight' && (
          <div style={{ fontSize: '0.7rem', color: 'var(--mr-blue-light)', marginTop: 4 }}>
            +{bonus.toFixed(1)} bônus
          </div>
        )}
        {mode === 'time' && (
          <div style={{ fontSize: '0.7rem', color: 'var(--mr-blue-light)', marginTop: 4 }}>
            {formatTime(item.timeMinutes)}
          </div>
        )}

        {showActions && (
          <div className="mr-flex mr-gap-1 mr-mt-2" style={{ justifyContent: 'flex-end' }}>
            <button
              title="Editar"
              onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}
              style={{
                width: 24, height: 24, borderRadius: 4,
                border: '1px solid var(--mr-border)', background: 'transparent',
                cursor: 'pointer', fontSize: '0.7rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--mr-text-secondary)',
              }}
            >✏️</button>
            <button
              title="Excluir"
              onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
              style={{
                width: 24, height: 24, borderRadius: 4,
                border: '1px solid var(--mr-border)', background: 'transparent',
                cursor: 'pointer', fontSize: '0.7rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--mr-text-secondary)',
              }}
            >🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componente: Painel de filtros ────────────────────────────────────────
function FilterPanel({ filters, onChange, onClear, resultCount }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const inputStyle = {
    width: 80, padding: '5px 8px', borderRadius: 6,
    border: '1px solid var(--mr-border)', background: 'var(--mr-bg)',
    color: 'var(--mr-text)', fontSize: '0.8rem',
  };

  const labelStyle = {
    fontSize: '0.7rem', color: 'var(--mr-text-secondary)',
    display: 'block', marginBottom: 3,
  };

  return (
    <div style={{
      padding: '1rem', borderRadius: 8, marginBottom: '1rem',
      background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
    }}>
      <div className="mr-flex mr-items-center mr-justify-between mr-mb-3">
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>🔎 Filtros</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
          {resultCount} obra{resultCount !== 1 ? 's' : ''} encontrada{resultCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mr-flex mr-flex-wrap mr-gap-4">
        <div>
          <label style={labelStyle}>Ano de lançamento (min/max)</label>
          <div className="mr-flex mr-items-center mr-gap-1">
            <input
              type="number" placeholder="1900" value={filters.releaseYearMin ?? ''}
              onChange={e => update('releaseYearMin', e.target.value ? parseInt(e.target.value, 10) : null)}
              style={inputStyle}
            />
            <span style={{ color: 'var(--mr-text-secondary)' }}>—</span>
            <input
              type="number" placeholder="2026" value={filters.releaseYearMax ?? ''}
              onChange={e => update('releaseYearMax', e.target.value ? parseInt(e.target.value, 10) : null)}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Adicionada entre</label>
          <div className="mr-flex mr-items-center mr-gap-1">
            <input
              type="date" value={filters.addedDateFrom ?? ''}
              onChange={e => update('addedDateFrom', e.target.value || null)}
              style={{ ...inputStyle, width: 130 }}
            />
            <span style={{ color: 'var(--mr-text-secondary)' }}>—</span>
            <input
              type="date" value={filters.addedDateTo ?? ''}
              onChange={e => update('addedDateTo', e.target.value || null)}
              style={{ ...inputStyle, width: 130 }}
            />
          </div>
        </div>

        <div className="mr-flex mr-items-end">
          <button
            className="mr-btn mr-btn-outline mr-btn-sm"
            onClick={onClear}
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente: Seletor de tabelas para o Unificado (RF-002) ─────────────
function TableSelector({ tables, selectedIds, onChange }) {
  function toggle(id) {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return;
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div style={{
      padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem',
      background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
    }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--mr-text-secondary)', marginBottom: 8 }}>
        Selecione quais tabelas incluir no ranking unificado:
      </div>
      <div className="mr-flex mr-flex-wrap mr-gap-2">
        {tables.map(t => {
          const active = selectedIds.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className="mr-btn mr-btn-sm"
              style={{
                background: active ? 'var(--mr-gold)' : 'transparent',
                color: active ? '#000' : 'var(--mr-text)',
                border: `1px solid ${active ? 'var(--mr-gold)' : 'var(--mr-border)'}`,
                opacity: !active && selectedIds.length === 1 ? 0.5 : 1,
                cursor: !active && selectedIds.length === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              {active ? '✓ ' : ''}{t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal de adicionar / editar obra ─────────────────────────────────────
function ItemModal({ tableType, item, onSave, onClose }) {
  const isEdit = !!item;

  const initialHHMM = minutesToHHMM(item?.timeMinutes);
  const [title, setTitle]   = useState(item?.title       ?? '');
  const [sub,   setSub]     = useState(item?.sub         ?? '');
  const [note,  setNote]    = useState(item?.note        ?? '');
  const [hours, setHours]   = useState(initialHHMM.hours ?? '');
  const [mins,  setMins]    = useState(initialHHMM.mins  ?? '');
  const [image, setImage]   = useState(item?.image       ?? '');
  const [releaseDate, setReleaseDate] = useState(item?.releaseDate ?? '');

  // Auto-preenchimento (RF-009)
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');

  async function handleAutoFill() {
    if (!title.trim()) {
      setSearchMsg('⚠️ Digite um título primeiro');
      return;
    }
    setSearching(true);
    setSearchMsg('🔎 Buscando metadados...');
    try {
      const data = await fetchMetadataSuggestion(title.trim());
      if (!data) {
        setSearchMsg('❌ Nenhuma obra encontrada com esse título');
        return;
      }
      if (data.director || data.studio || data.author) setSub(data.director || data.studio || data.author);
      if (data.timeMinutes) {
        const h = Math.floor(data.timeMinutes / 60);
        const m = data.timeMinutes % 60;
        setHours(h || '');
        setMins(m || '');
      }
      if (data.image) setImage(data.image);
      if (data.releaseDate) setReleaseDate(data.releaseDate);
      setSearchMsg('✓ Metadados preenchidos automaticamente!');
    } catch {
      setSearchMsg('❌ Erro ao buscar metadados');
    } finally {
      setSearching(false);
    }
  }

  function handleSave() {
    const n = parseFloat(note);
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(mins, 10) || 0;
    const t = h * 60 + m;

    if (!title.trim() || isNaN(n) || n < 0 || n > 10 || t <= 0) return;

    const finalNote = parseFloat((n + Math.log10(t / 60)).toFixed(2));
    const bonusTime = parseFloat(Math.log10(t / 60).toFixed(2));

    onSave({
      id:          item?.id ?? String(Date.now()),
      title:       title.trim(),
      sub:         sub.trim(),
      note:        n,
      timeMinutes: t,
      bonusTime,
      finalNote,
      addedDate:   item?.addedDate ?? new Date().toISOString().slice(0, 10),
      releaseDate: releaseDate || null,
      image:       image.trim(),
    });
  }

  const inputStyle = {
    width: '100%', padding: '7px 10px',
    borderRadius: 7, border: '1px solid var(--mr-border)',
    background: 'var(--mr-bg)', color: 'var(--mr-text)',
    fontSize: '0.875rem',
  };

  const labelStyle = {
    fontSize: '0.75rem', color: 'var(--mr-text-secondary)',
    display: 'block', marginBottom: 4,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
          borderRadius: 12, padding: '1.5rem', width: 400, maxWidth: '90vw',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>
          {isEdit ? '✏️ Editar obra' : '➕ Adicionar obra'}
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Título</label>
          <div className="mr-flex mr-gap-2">
            <input
              type="text" value={title} placeholder="Ex: Interstellar"
              onChange={e => setTitle(e.target.value)}
              style={inputStyle}
            />
            <button
              className="mr-btn mr-btn-outline mr-btn-sm"
              onClick={handleAutoFill}
              disabled={searching}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {searching ? '⏳ Buscando...' : '🔍 Auto-preencher'}
            </button>
          </div>
          {searchMsg && (
            <div style={{
              fontSize: '0.7rem', marginTop: 4,
              color: searchMsg.startsWith('✓') ? 'var(--mr-gold)' : 'var(--mr-text-secondary)',
            }}>
              {searchMsg}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Autor / Diretor / Estúdio</label>
          <input
            type="text" value={sub} placeholder="Ex: Christopher Nolan"
            onChange={e => setSub(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nota (0,0 – 10,0)</label>
          <input
            type="number" step="0.1" min="0" max="10"
            value={note} placeholder="Ex: 9.2"
            onChange={e => setNote(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Tempo de consumo</label>
          <div className="mr-flex mr-items-center mr-gap-2">
            <input
              type="number" min="0" value={hours}
              placeholder="0" onChange={e => setHours(e.target.value)}
              style={{ ...inputStyle, width: 80 }}
            />
            <span style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>h</span>
            <input
              type="number" min="0" max="59" value={mins}
              placeholder="0" onChange={e => setMins(e.target.value)}
              style={{ ...inputStyle, width: 80 }}
            />
            <span style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>min</span>
          </div>
          {(parseInt(hours, 10) > 0 || parseInt(mins, 10) > 0) && (
            <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>
              Total: {formatTime((parseInt(hours, 10) || 0) * 60 + (parseInt(mins, 10) || 0))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Data de lançamento</label>
          <input
            type="date" value={releaseDate}
            onChange={e => setReleaseDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>URL da imagem</label>
          <div className="mr-flex mr-gap-2">
            <input
              type="text" value={image} placeholder="https://..."
              onChange={e => setImage(e.target.value)}
              style={inputStyle}
            />
            {image && (
              <div style={{ flexShrink: 0, width: 36, height: 54, borderRadius: 4, overflow: 'hidden' }}>
                <img src={image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>
            Deixe vazio para usar placeholder automático
          </div>
        </div>

        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose}>Cancelar</button>
          <button className="mr-btn mr-btn-gold mr-btn-sm"    onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Tabela unificada (read-only) ─────────────────────────────────────────
function UnifiedTable({ tables, selectedTableIds, sortBy, useTimeWeight, viewMode, filters }) {
  const mode    = getMode(sortBy, useTimeWeight);
  const maxNote = mode === 'weight' ? 12 : 10;
  const cols    = getColumnConfig(mode, false, viewMode === 'list');

  const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));

  const allItems = useMemo(() =>
    selectedTables.flatMap(t =>
      t.items.map(item => ({ ...item, _tableLabel: t.label, _tableId: t.id }))
    ),
  [selectedTables]);

  const filteredItems = useMemo(() => applyFilters(allItems, filters), [allItems, filters]);
  const sorted = sortItems(filteredItems, sortBy, useTimeWeight);

  // Modo Grid
  if (viewMode === 'grid') {
    return (
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '1rem',
        }}>
          {sorted.map((item, i) => (
            <GridCard
              key={item.id + item._tableId}
              item={item}
              mode={mode}
              maxNote={maxNote}
              index={i}
              showActions={false}
            />
          ))}
        </div>
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)' }}>
            Nenhuma obra encontrada com os filtros atuais. 🔍
          </div>
        )}
      </div>
    );
  }

  // Modo Lista
  return (
    <div>
      <div className="mr-space-y-4">
        <div
          className="mr-flex mr-items-center mr-gap-2"
          style={{
            padding: '8px 14px', borderRadius: 8,
            background: 'var(--mr-gold-subtle, rgba(201,162,39,0.08))',
            border: '1px solid rgba(201,162,39,0.25)',
            fontSize: '0.8rem', color: 'var(--mr-text-secondary)',
          }}
        >
          <span>🔒</span>
          <span>Este ranking é gerado automaticamente a partir das suas tabelas. Para editar, acesse a tabela individual.</span>
        </div>

        <div className="mr-table-header" style={{ gridTemplateColumns: cols.gridTemplate }}>
          {cols.headers.map((h, i) => <span key={i}>{h}</span>)}
        </div>

        <div className="mr-space-y-2">
          {sorted.map((item, i) => {
            const displayNote = mode === 'weight' ? item.finalNote : item.note;
            const bonus       = mode === 'weight' ? item.bonusTime : 0;
            const barWidth    = Math.min((displayNote / maxNote) * 100, 100);

            return (
              <div
                className="mr-table-row"
                key={item.id + item._tableId}
                style={{
                  gridTemplateColumns: cols.gridTemplate,
                  borderLeft: i < 3 ? '3px solid var(--mr-gold)' : undefined,
                }}
              >
                <span style={{ fontWeight: 700, color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-secondary)' }}>
                  {i + 1}
                </span>

                {viewMode === 'list' && (
                  <Poster src={item.image} title={item.title} size="thumb" />
                )}

                <div className="mr-min-w-0">
                  <div className="mr-truncate" style={{ fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>{item.sub}</div>
                </div>
                <span className="mr-badge mr-badge-outline" style={badgeStyle}>
                  {item._tableLabel}
                </span>

                {mode === 'weight' && (
                  <>
                    <span style={{ fontWeight: 600 }}>{item.note.toFixed(1)}</span>
                    <span style={{ color: 'var(--mr-blue-light)', fontWeight: 500, fontSize: '0.875rem' }}>
                      {bonus > 0 ? `+${bonus.toFixed(1)}` : '—'}
                    </span>
                    <div className="mr-flex mr-items-center mr-gap-3">
                      <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36 }}>
                        {displayNote.toFixed(1)}
                      </span>
                      <div className="mr-note-bar">
                        <div className={`mr-note-bar-fill ${getNoteBarColor(displayNote)}`} style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  </>
                )}

                {mode === 'simple' && (
                  <div className="mr-flex mr-items-center mr-gap-3">
                    <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36 }}>
                      {item.note.toFixed(1)}
                    </span>
                    <div className="mr-note-bar">
                      <div className={`mr-note-bar-fill ${getNoteBarColor(item.note)}`} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                )}

                {mode === 'time' && (
                  <>
                    <span style={{ fontWeight: 600 }}>{item.note.toFixed(1)}</span>
                    <span style={{ fontWeight: 600, color: 'var(--mr-blue-light)' }}>
                      {formatTime(item.timeMinutes)}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
            Nenhuma obra encontrada com os filtros atuais. 🔍
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tabela individual (editável) ─────────────────────────────────────────
function IndividualTable({ table, sortBy, useTimeWeight, viewMode, filters, onUpdateTable, onDeleteTable }) {
  const [modal, setModal] = useState(null);
  const mode    = getMode(sortBy, useTimeWeight);
  const maxNote = mode === 'weight' ? 12 : 10;
  const cols    = getColumnConfig(mode, true, viewMode === 'list');

  const filteredItems = useMemo(() => applyFilters(table.items, filters), [table.items, filters]);
  const sorted = sortItems(filteredItems, sortBy, useTimeWeight);

  function handleSave(saved) {
    const exists = table.items.find(x => x.id === saved.id);
    const newItems = exists
      ? table.items.map(x => x.id === saved.id ? saved : x)
      : [...table.items, saved];
    onUpdateTable({ ...table, items: newItems });
    setModal(null);
  }

  function handleDelete(id) {
    if (!window.confirm('Remover esta obra do ranking?')) return;
    onUpdateTable({ ...table, items: table.items.filter(x => x.id !== id) });
  }

  // Toolbar comum (com botão excluir tabela + adicionar obra)
  const Toolbar = () => (
    <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-2" style={{ marginBottom: '1rem' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>
        {table.items.length} obra{table.items.length !== 1 ? 's' : ''}
      </span>
      <div className="mr-flex mr-gap-2">
        <button
          className="mr-btn mr-btn-outline mr-btn-sm"
          style={{ color: '#e24b4a', borderColor: 'rgba(226,75,74,0.35)' }}
          onClick={() => {
            if (window.confirm(`Excluir a tabela "${table.label}" e todos os seus itens?`)) {
              onDeleteTable(table.id);
            }
          }}
        >
          🗑️ Excluir tabela
        </button>
        <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={() => setModal('add')}>
          ➕ Adicionar obra
        </button>
      </div>
    </div>
  );

  // Modo Grid
  if (viewMode === 'grid') {
    return (
      <div>
        <Toolbar />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '1rem',
        }}>
          {sorted.map((item, i) => (
            <GridCard
              key={item.id}
              item={item}
              mode={mode}
              maxNote={maxNote}
              index={i}
              showActions={true}
              onEdit={(it) => setModal(it)}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
            Nenhuma obra encontrada com os filtros atuais. 🔍
          </div>
        )}

        {modal && (
          <ItemModal
            tableType={table.type}
            item={modal === 'add' ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    );
  }

  // Modo Lista
  return (
    <div>
      <Toolbar />

      <div className="mr-table-header" style={{ gridTemplateColumns: cols.gridTemplate }}>
        {cols.headers.map((h, i) => <span key={i}>{h}</span>)}
      </div>

      <div className="mr-space-y-2">
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
            Nenhuma obra encontrada com os filtros atuais. 🔍
          </div>
        )}
        {sorted.map((item, i) => {
          const displayNote = mode === 'weight' ? item.finalNote : item.note;
          const bonus       = mode === 'weight' ? item.bonusTime : 0;
          const barWidth    = Math.min((displayNote / maxNote) * 100, 100);

          return (
            <div
              className="mr-table-row"
              key={item.id}
              style={{
                gridTemplateColumns: cols.gridTemplate,
                borderLeft: i < 3 ? '3px solid var(--mr-gold)' : undefined,
              }}
            >
              <span style={{ fontWeight: 700, color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-secondary)' }}>
                {i + 1}
              </span>

              {viewMode === 'list' && (
                <Poster src={item.image} title={item.title} size="thumb" />
              )}

              <div className="mr-min-w-0">
                <div className="mr-truncate" style={{ fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>{item.sub}</div>
              </div>

              {mode === 'weight' && (
                <>
                  <span style={{ fontWeight: 600 }}>{item.note.toFixed(1)}</span>
                  <span style={{ color: 'var(--mr-blue-light)', fontWeight: 500, fontSize: '0.875rem' }}>
                    {bonus > 0 ? `+${bonus.toFixed(1)}` : '—'}
                  </span>
                  <div className="mr-flex mr-items-center mr-gap-3">
                    <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36 }}>
                      {displayNote.toFixed(1)}
                    </span>
                    <div className="mr-note-bar">
                      <div className={`mr-note-bar-fill ${getNoteBarColor(displayNote)}`} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                </>
              )}

              {mode === 'simple' && (
                <div className="mr-flex mr-items-center mr-gap-3">
                  <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36 }}>
                    {item.note.toFixed(1)}
                  </span>
                  <div className="mr-note-bar">
                    <div className={`mr-note-bar-fill ${getNoteBarColor(item.note)}`} style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              )}

              {mode === 'time' && (
                <>
                  <span style={{ fontWeight: 600 }}>{item.note.toFixed(1)}</span>
                  <span style={{ fontWeight: 600, color: 'var(--mr-blue-light)' }}>
                    {formatTime(item.timeMinutes)}
                  </span>
                </>
              )}

              <div className="mr-flex mr-gap-1" style={{ justifyContent: 'flex-end' }}>
                <button
                  title="Editar" onClick={() => setModal(item)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: '1px solid var(--mr-border)', background: 'transparent',
                    cursor: 'pointer', fontSize: '0.8rem', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--mr-text-secondary)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--mr-gold)'; e.currentTarget.style.borderColor = 'var(--mr-gold)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--mr-text-secondary)'; e.currentTarget.style.borderColor = 'var(--mr-border)'; }}
                >✏️</button>
                <button
                  title="Excluir" onClick={() => handleDelete(item.id)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: '1px solid var(--mr-border)', background: 'transparent',
                    cursor: 'pointer', fontSize: '0.8rem', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--mr-text-secondary)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#e24b4a'; e.currentTarget.style.borderColor = '#e24b4a'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--mr-text-secondary)'; e.currentTarget.style.borderColor = 'var(--mr-border)'; }}
                >🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <ItemModal
          tableType={table.type}
          item={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Modal: criar nova tabela ──────────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: 'filme',  label: '🎬 Filmes',  emoji: '🎬' },
  { value: 'jogo',   label: '🎮 Jogos',   emoji: '🎮' },
  { value: 'serie',  label: '📺 Séries',  emoji: '📺' },
  { value: 'livro',  label: '📚 Livros',  emoji: '📚' },
  { value: 'anime',  label: '🎌 Animes',  emoji: '🎌' },
  { value: 'outro',  label: '📦 Outro',   emoji: '📦' },
];

function NewTableModal({ onSave, onClose }) {
  const [name,        setName]        = useState('');
  const [type,        setType]        = useState('filme');
  const [customEmoji, setCustomEmoji] = useState('📦');

  const isOutro = type === 'outro';
  const selectedType = TYPE_OPTIONS.find(o => o.value === type);
  const finalEmoji = isOutro ? (customEmoji.trim() || '📦') : (selectedType?.emoji ?? '');
  const finalLabel = name.trim() ? `${finalEmoji} ${name.trim()}` : '';

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id:    `custom_${Date.now()}`,
      label: finalLabel,
      type,
      items: [],
    });
  }

  const inputStyle = {
    width: '100%', padding: '7px 10px',
    borderRadius: 7, border: '1px solid var(--mr-border)',
    background: 'var(--mr-bg)', color: 'var(--mr-text)',
    fontSize: '0.875rem',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--mr-surface)', border: '1px solid var(--mr-border)', borderRadius: 12, padding: '1.5rem', width: 340, maxWidth: '90vw' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📋 Nova tabela</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 4 }}>Nome</label>
          <input
            type="text" value={name} placeholder="Ex: Maratona Nolan"
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 4 }}>Tipo de mídia</label>
          <select
            value={type} onChange={e => setType(e.target.value)}
            style={inputStyle}
          >
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {isOutro && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 4 }}>
              Emoji da tabela
            </label>
            <input
              type="text" value={customEmoji}
              placeholder="🎨 🎵 🎤 ⚽ 🍿..."
              onChange={e => setCustomEmoji(e.target.value)}
              maxLength={4}
              style={{ ...inputStyle, width: 80, textAlign: 'center', fontSize: '1.1rem' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>
              Escolha um emoji que represente sua tabela
            </div>
          </div>
        )}

        {name.trim() && (
          <div style={{
            marginBottom: 12, padding: '8px 10px', borderRadius: 7,
            background: 'var(--mr-gold-subtle, rgba(201,162,39,0.08))',
            border: '1px solid rgba(201,162,39,0.25)',
            fontSize: '0.8rem', color: 'var(--mr-text-secondary)',
          }}>
            Preview: <strong style={{ color: 'var(--mr-text)' }}>{finalLabel}</strong>
          </div>
        )}

        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose}>Cancelar</button>
          <button className="mr-btn mr-btn-gold mr-btn-sm"    onClick={handleSave}>Criar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function RankingsTab() {
  const [tables,            setTables]            = useState(INITIAL_TABLES);
  const [activeTab,         setActiveTab]         = useState('unified');
  const [useTimeWeight,     setUseTimeWeight]     = useState(true);
  const [sortBy,            setSortBy]            = useState('nota');
  const [viewMode,          setViewMode]          = useState('list');
  const [showFilters,       setShowFilters]       = useState(false);
  const [filters,           setFilters]           = useState({});
  const [selectedTableIds,  setSelectedTableIds]  = useState(INITIAL_TABLES.map(t => t.id));
  const [showNewTable,      setShowNewTable]      = useState(false);

  function handleUpdateTable(updated) {
    setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  function handleDeleteTable(id) {
    setTables(prev => prev.filter(t => t.id !== id));
    setSelectedTableIds(prev => prev.filter(x => x !== id));
    setActiveTab('unified');
  }

  function handleCreateTable(newTable) {
    setTables(prev => [...prev, newTable]);
    setSelectedTableIds(prev => [...prev, newTable.id]);
    setActiveTab(newTable.id);
    setShowNewTable(false);
  }

  // Conta items filtrados (para o painel de filtros)
  const filteredCount = useMemo(() => {
    if (activeTab === 'unified') {
      const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));
      const allItems = selectedTables.flatMap(t => t.items);
      return applyFilters(allItems, filters).length;
    }
    const table = tables.find(t => t.id === activeTab);
    if (!table) return 0;
    return applyFilters(table.items, filters).length;
  }, [activeTab, tables, selectedTableIds, filters]);

  return (
    <div className="mr-space-y-6">
      {/* ── Header ── */}
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🏆 Rankings</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Compare e analise suas avaliações
          </p>
        </div>
        <div className="mr-flex mr-items-center mr-gap-3">
          <span style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>Ponderação por tempo</span>
          <button className={`mr-switch ${useTimeWeight ? 'checked' : ''}`} onClick={() => setUseTimeWeight(v => !v)}>
            <span className="mr-switch-thumb" />
          </button>
        </div>
      </div>

      {/* ── Abas de tabelas ── */}
      <div className="mr-flex mr-items-center mr-gap-1 mr-flex-wrap" style={{ borderBottom: '1px solid var(--mr-border)', paddingBottom: 0 }}>
        <button
          className={`mr-tab-trigger ${activeTab === 'unified' ? 'active' : ''}`}
          onClick={() => setActiveTab('unified')}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          🏆 Unificado
        </button>

        {tables.map(t => (
          <button
            key={t.id}
            className={`mr-tab-trigger ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            style={{ borderRadius: '8px 8px 0 0' }}
          >
            {t.label}
          </button>
        ))}

        <button
          className="mr-btn mr-btn-outline mr-btn-sm"
          style={{ marginLeft: 'auto', marginBottom: 2 }}
          onClick={() => setShowNewTable(true)}
        >
          ➕ Nova tabela
        </button>
      </div>

      {/* ── Toolbar: Ordenação + View + Filtros ── */}
      <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap">
        <div className="mr-flex mr-gap-2">
          <button
            className={`mr-btn mr-btn-sm ${sortBy === 'nota' ? 'mr-btn-gold' : 'mr-btn-outline'}`}
            onClick={() => setSortBy('nota')}
          >
            Notas
          </button>
          <button
            className={`mr-btn mr-btn-sm ${sortBy === 'time' ? 'mr-btn-gold' : 'mr-btn-outline'}`}
            onClick={() => setSortBy('time')}
          >
            Tempo
          </button>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--mr-border)' }} />

        <div className="mr-flex mr-gap-1">
          <button
            className={`mr-btn mr-btn-sm ${viewMode === 'list' ? 'mr-btn-gold' : 'mr-btn-outline'}`}
            onClick={() => setViewMode('list')}
            title="Visualização em lista"
          >📋</button>
          <button
            className={`mr-btn mr-btn-sm ${viewMode === 'grid' ? 'mr-btn-gold' : 'mr-btn-outline'}`}
            onClick={() => setViewMode('grid')}
            title="Visualização em grid"
          >🎞️</button>
        </div>

        {/* Botão Filtros — disponível em TODAS as abas agora */}
        <div style={{ width: 1, height: 24, background: 'var(--mr-border)' }} />
        <button
          className={`mr-btn mr-btn-sm ${showFilters ? 'mr-btn-gold' : 'mr-btn-outline'}`}
          onClick={() => setShowFilters(v => !v)}
        >
          🔎 Filtros {Object.keys(filters).length > 0 && '•'}
        </button>
      </div>

      {/* ── Seleção de tabelas (RF-002) — só no unificado ── */}
      {activeTab === 'unified' && (
        <TableSelector
          tables={tables}
          selectedIds={selectedTableIds}
          onChange={setSelectedTableIds}
        />
      )}

      {/* ── Painel de filtros (RF-008) — em todas as abas ── */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({})}
          resultCount={filteredCount}
        />
      )}

      {/* ── Conteúdo da aba ── */}
      {activeTab === 'unified' ? (
        <UnifiedTable
          tables={tables}
          selectedTableIds={selectedTableIds}
          sortBy={sortBy}
          useTimeWeight={useTimeWeight}
          viewMode={viewMode}
          filters={filters}
        />
      ) : (
        (() => {
          const table = tables.find(t => t.id === activeTab);
          if (!table) return null;
          return (
            <IndividualTable
              table={table}
              sortBy={sortBy}
              useTimeWeight={useTimeWeight}
              viewMode={viewMode}
              filters={filters}
              onUpdateTable={handleUpdateTable}
              onDeleteTable={handleDeleteTable}
            />
          );
        })()
      )}

      {/* ── Ranking de Autores/Diretores ── */}
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 16 }}>👤 Ranking de Autores/Diretores</h2>
        <div className="mr-author-grid">
          {authorRankings.map((author, i) => (
            <div className="mr-author-card" key={i}>
              <div className="mr-flex mr-items-center mr-gap-3">
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-secondary)', width: 28 }}>
                  {i + 1}
                </span>
                <div className="mr-flex-1">
                  <div style={{ fontWeight: 600 }}>{author.name}</div>
                  <span className="mr-badge mr-badge-outline mr-mt-2">{getAuthorTypeBadge(author.type)}</span>
                </div>
              </div>
              <div className="mr-author-stats">
                <div>
                  <div className="mr-author-stat-label">Média</div>
                  <div className="mr-author-stat-value" style={{ color: 'var(--mr-gold)' }}>{author.avgNote.toFixed(1)}</div>
                </div>
                <div>
                  <div className="mr-author-stat-label">Simples</div>
                  <div className="mr-author-stat-value">{author.avgNote.toFixed(1)}</div>
                </div>
                <div>
                  <div className="mr-author-stat-label">Ponderada</div>
                  <div className="mr-author-stat-value" style={{ color: 'var(--mr-blue-light)' }}>{author.weightedAvg.toFixed(1)}</div>
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

      {/* ── Fórmulas ── */}
      <div className="mr-info-card-gold">
        <div className="mr-card-body mr-flex mr-items-start mr-gap-4">
          <span style={{ fontSize: '1.5rem' }}>📜</span>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Fórmulas de Cálculo</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>
              <div style={{ marginBottom: 4 }}>
                <span className="mr-code mr-code-gold">Nota Final = Nota Original + log₁₀(Tempo / 60min)</span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <span className="mr-code mr-code-blue">Média Ponderada = Σ(nota × tempo) / Σ(tempo)</span>
              </div>
              <div>
                O bônus de tempo recompensa obras que exigem maior investimento,
                enquanto a média ponderada considera o tempo como peso na média dos autores.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modais globais ── */}
      {showNewTable && (
        <NewTableModal onSave={handleCreateTable} onClose={() => setShowNewTable(false)} />
      )}
    </div>
  );
}