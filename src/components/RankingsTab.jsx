import React, { useState } from 'react';
import { authorRankings, calculateFinalNote, INITIAL_TABLES } from '../data/mockData';
import { singularizeLabel } from '../utils/singularizeLabel';

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

function sortItems(items, sortBy, useTimeWeight) {
  return [...items].sort((a, b) => {
    if (sortBy === 'time')         return b.timeMinutes - a.timeMinutes;
    if (sortBy === 'originalNote') return b.note - a.note;
    // finalNote
    return useTimeWeight ? b.finalNote - a.finalNote : b.note - a.note;
  });
}

// ─── Modal de adicionar / editar obra ─────────────────────────────────────
function ItemModal({ tableType, item, onSave, onClose }) {
  const isEdit = !!item;
  const [title, setTitle]     = useState(item?.title       ?? '');
  const [sub,   setSub]       = useState(item?.sub         ?? '');
  const [note,  setNote]      = useState(item?.note        ?? '');
  const [time,  setTime]      = useState(item?.timeMinutes ?? '');

  function handleSave() {
    const n = parseFloat(note);
    const t = parseInt(time, 10);
    if (!title.trim() || isNaN(n) || n < 0 || n > 10 || isNaN(t) || t <= 0) return;
    const bonus     = Math.max(0, calculateFinalNote(0, t)); // log10(t/60)
    const finalNote = parseFloat((n + Math.log10(t / 60)).toFixed(2));
    onSave({
      id:          item?.id ?? String(Date.now()),
      title:       title.trim(),
      sub:         sub.trim(),
      note:        n,
      timeMinutes: t,
      bonusTime:   parseFloat(Math.log10(t / 60).toFixed(2)),
      finalNote,
      addedDate:   item?.addedDate ?? new Date().toISOString().slice(0, 10),
    });
  }

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
          borderRadius: 12, padding: '1.5rem', width: 360, maxWidth: '90vw',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>
          {isEdit ? '✏️ Editar obra' : '➕ Adicionar obra'}
        </h3>

        {[
          { label: 'Título',               value: title, set: setTitle, type: 'text',   ph: 'Ex: Interstellar' },
          { label: 'Autor / Diretor / Estúdio', value: sub, set: setSub, type: 'text', ph: 'Ex: Christopher Nolan' },
          { label: 'Nota (0 – 10)',         value: note,  set: setNote,  type: 'number', ph: 'Ex: 9.2' },
          { label: 'Tempo (minutos)',       value: time,  set: setTime,  type: 'number', ph: 'Ex: 169' },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 4 }}>
              {f.label}
            </label>
            <input
              type={f.type}
              value={f.value}
              placeholder={f.ph}
              onChange={e => f.set(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px',
                borderRadius: 7, border: '1px solid var(--mr-border)',
                background: 'var(--mr-bg)', color: 'var(--mr-text)',
                fontSize: '0.875rem',
              }}
            />
          </div>
        ))}

        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose}>Cancelar</button>
          <button className="mr-btn mr-btn-gold mr-btn-sm"    onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Tabela unificada (read-only) ─────────────────────────────────────────
function UnifiedTable({ tables, sortBy, useTimeWeight }) {
  const maxNote = useTimeWeight ? 12 : 10;

  const allItems = tables.flatMap(t =>
    t.items.map(item => ({ ...item, _tableLabel: t.label, _tableId: t.id }))
  );
  const sorted = sortItems(allItems, sortBy, useTimeWeight);

  return (
    <div>
      {/* banner info */}
      <div
        className="mr-flex mr-items-center mr-gap-2"
        style={{
          padding: '8px 14px', borderRadius: 8, marginBottom: '1rem',
          background: 'var(--mr-gold-subtle, rgba(201,162,39,0.08))',
          border: '1px solid rgba(201,162,39,0.25)',
          fontSize: '0.8rem', color: 'var(--mr-text-secondary)',
        }}
      >
        <span>🔒</span>
        <span>Este ranking é gerado automaticamente a partir das suas tabelas. Para editar, acesse a tabela individual.</span>
      </div>

      {/* cabeçalho */}
      <div className="mr-table-header" style={{ gridTemplateColumns: '2rem 1fr auto auto auto auto' }}>
        <span>#</span>
        <span>Título</span>
        <span>Tabela</span>
        <span>Nota</span>
        <span>Bônus</span>
        <span>Nota Final</span>
      </div>

      <div className="mr-space-y-2">
        {sorted.map((item, i) => {
          const displayNote = useTimeWeight ? item.finalNote : item.note;
          const bonus       = useTimeWeight ? item.bonusTime : 0;
          const barWidth    = Math.min((displayNote / maxNote) * 100, 100);

          return (
            <div
              className="mr-table-row"
              key={item.id + item._tableId}
              style={{
                gridTemplateColumns: '2rem 1fr auto auto auto auto',
                borderLeft: i < 3 ? '3px solid var(--mr-gold)' : undefined,
              }}
            >
              <span style={{ fontWeight: 700, color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-secondary)' }}>
                {i + 1}
              </span>
              <div className="mr-min-w-0">
                <div className="mr-truncate" style={{ fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>{item.sub}</div>
              </div>
              <span className="mr-badge mr-badge-outline" style={{ fontSize: '0.7rem' }}>
                {singularizeLabel(item._tableLabel)}
              </span>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tabela individual (editável) ─────────────────────────────────────────
function IndividualTable({ table, sortBy, useTimeWeight, onUpdateTable, onDeleteTable }) {
  const [modal, setModal] = useState(null); // null | 'add' | item (para editar)
  const maxNote = useTimeWeight ? 12 : 10;
  const sorted  = sortItems(table.items, sortBy, useTimeWeight);

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

  return (
    <div>
      {/* toolbar */}
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

      {/* cabeçalho */}
      <div className="mr-table-header" style={{ gridTemplateColumns: '2rem 1fr auto auto auto auto auto' }}>
        <span>#</span>
        <span>Título</span>
        <span>Tipo</span>
        <span>Nota</span>
        <span>Bônus</span>
        <span>Nota Final</span>
        <span>Ações</span>
      </div>

      {/* linhas */}
      <div className="mr-space-y-2">
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
            Nenhuma obra ainda. Adicione a primeira! 🎬
          </div>
        )}
        {sorted.map((item, i) => {
          const displayNote = useTimeWeight ? item.finalNote : item.note;
          const bonus       = useTimeWeight ? item.bonusTime : 0;
          const barWidth    = Math.min((displayNote / maxNote) * 100, 100);

          return (
            <div
              className="mr-table-row"
              key={item.id}
              style={{
                gridTemplateColumns: '2rem 1fr auto auto auto auto auto',
                borderLeft: i < 3 ? '3px solid var(--mr-gold)' : undefined,
              }}
            >
              <span style={{ fontWeight: 700, color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-secondary)' }}>
                {i + 1}
              </span>
              <div className="mr-min-w-0">
                <div className="mr-truncate" style={{ fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>{item.sub}</div>
              </div>
              <span className="mr-badge mr-badge-outline">{singularizeLabel(table.label)}</span>
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
              {/* ações */}
              <div className="mr-flex mr-gap-1" style={{ justifyContent: 'flex-end' }}>
                <button
                  title="Editar"
                  onClick={() => setModal(item)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: '1px solid var(--mr-border)', background: 'transparent',
                    cursor: 'pointer', fontSize: '0.8rem', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--mr-text-secondary)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--mr-gold)'; e.currentTarget.style.borderColor = 'var(--mr-gold)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--mr-text-secondary)'; e.currentTarget.style.borderColor = 'var(--mr-border)'; }}
                >
                  ✏️
                </button>
                <button
                  title="Excluir"
                  onClick={() => handleDelete(item.id)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: '1px solid var(--mr-border)', background: 'transparent',
                    cursor: 'pointer', fontSize: '0.8rem', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--mr-text-secondary)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#e24b4a'; e.currentTarget.style.borderColor = '#e24b4a'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--mr-text-secondary)'; e.currentTarget.style.borderColor = 'var(--mr-border)'; }}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* modal */}
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
  { value: 'filme',  label: '🎬 Filmes' },
  { value: 'jogo',   label: '🎮 Jogos' },
  { value: 'serie',  label: '📺 Séries' },
  { value: 'livro',  label: '📚 Livros' },
  { value: 'anime',  label: '🎌 Animes' },
  { value: 'outro',  label: '📦 Outro' },
];

function NewTableModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('filme');

  function handleSave() {
    if (!name.trim()) return;
    const opt = TYPE_OPTIONS.find(o => o.value === type);
    onSave({
      id:    `custom_${Date.now()}`,
      label: `${opt?.label.split(' ')[0] ?? ''} ${name.trim()}`,
      type,
      items: [],
    });
  }

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
            style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--mr-border)', background: 'var(--mr-bg)', color: 'var(--mr-text)', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 4 }}>Tipo de mídia</label>
          <select
            value={type} onChange={e => setType(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--mr-border)', background: 'var(--mr-bg)', color: 'var(--mr-text)', fontSize: '0.875rem' }}
          >
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

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
  const [tables,        setTables]        = useState(INITIAL_TABLES);
  const [activeTab,     setActiveTab]     = useState('unified');
  const [useTimeWeight, setUseTimeWeight] = useState(true);
  const [sortBy,        setSortBy]        = useState('finalNote');
  const [showNewTable,  setShowNewTable]  = useState(false);

  function handleUpdateTable(updated) {
    setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  function handleDeleteTable(id) {
    setTables(prev => prev.filter(t => t.id !== id));
    setActiveTab('unified');
  }

  function handleCreateTable(newTable) {
    setTables(prev => [...prev, newTable]);
    setActiveTab(newTable.id);
    setShowNewTable(false);
  }

  const maxNote = useTimeWeight ? 12 : 10;

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
        {/* Unificado */}
        <button
          className={`mr-tab-trigger ${activeTab === 'unified' ? 'active' : ''}`}
          onClick={() => setActiveTab('unified')}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          🏆 Unificado
        </button>

        {/* Tabelas individuais */}
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

        {/* Nova tabela */}
        <button
          className="mr-btn mr-btn-outline mr-btn-sm"
          style={{ marginLeft: 'auto', marginBottom: 2 }}
          onClick={() => setShowNewTable(true)}
        >
          ➕ Nova tabela
        </button>
      </div>

      {/* ── Ordenação ── */}
      <div className="mr-flex mr-gap-2 mr-flex-wrap">
        {[
          { key: 'finalNote',    label: useTimeWeight ? 'Nota Final' : 'Nota' },
          { key: 'originalNote', label: 'Nota Original' },
          { key: 'time',         label: 'Tempo' },
        ].map(s => (
          <button
            key={s.key}
            className={`mr-btn mr-btn-sm ${sortBy === s.key ? 'mr-btn-gold' : 'mr-btn-outline'}`}
            onClick={() => setSortBy(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Conteúdo da aba ── */}
      {activeTab === 'unified' ? (
        <UnifiedTable tables={tables} sortBy={sortBy} useTimeWeight={useTimeWeight} />
      ) : (
        (() => {
          const table = tables.find(t => t.id === activeTab);
          if (!table) return null;
          return (
            <IndividualTable
              table={table}
              sortBy={sortBy}
              useTimeWeight={useTimeWeight}
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