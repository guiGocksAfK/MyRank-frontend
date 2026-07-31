import React, { useState, useMemo } from 'react';
import Poster from './Poster';
import GridCard from './GridCard';
import ItemModal from './ItemModal';
import { getNoteBarColor, formatTime, sortItems, getMode, applyFilters, getColumnConfig } from '../../utils/formatters';

export default function IndividualTable({ table, sortBy, useTimeWeight, viewMode, filters, onSaveWork, onDeleteWork, onDeleteTable }) {
  const [modal, setModal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const mode    = getMode(sortBy, useTimeWeight);
  const maxNote = mode === 'weight' ? 12 : 10;
  const cols    = getColumnConfig(mode, true, viewMode === 'list');

  const filteredItems = useMemo(() => applyFilters(table.items, filters), [table.items, filters]);
  const sorted = sortItems(filteredItems, sortBy, useTimeWeight);

  async function handleSave(payload) {
    await onSaveWork(table.id, payload);
  }

  async function handleDelete(id) {
    if (!window.confirm('Remover esta obra do ranking?')) return;
    setDeletingId(id);
    try {
      await onDeleteWork(table.id, id);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Erro ao excluir a obra.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteTableClick() {
    if (!window.confirm(`Excluir a tabela "${table.label}" e todos os seus itens?`)) return;
    try {
      await onDeleteTable(table.id);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Erro ao excluir a tabela.');
    }
  }

  const Toolbar = () => (
    <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-2" style={{ marginBottom: '1rem' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>
        {table.items.length} obra{table.items.length !== 1 ? 's' : ''}
      </span>
      <div className="mr-flex mr-gap-2">
        <button
          className="mr-btn mr-btn-outline mr-btn-sm"
          style={{ color: '#e24b4a', borderColor: 'rgba(226,75,74,0.35)' }}
          onClick={handleDeleteTableClick}
        >
          🗑️ Excluir tabela
        </button>
        <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={() => setModal('add')}>
          ➕ Adicionar obra
        </button>
      </div>
    </div>
  );

  if (viewMode === 'grid') {
    return (
      <div>
        <Toolbar />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
          {sorted.map((item, i) => (
            <GridCard
              key={item.id} item={item} mode={mode} maxNote={maxNote} index={i}
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
          <ItemModal item={modal === 'add' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />
        )}
      </div>
    );
  }

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
          const isDeleting  = deletingId === item.id;

          return (
            <div
              className="mr-table-row"
              key={item.id}
              style={{ gridTemplateColumns: cols.gridTemplate, borderLeft: i < 3 ? '3px solid var(--mr-gold)' : undefined, opacity: isDeleting ? 0.5 : 1 }}
            >
              <span style={{ fontWeight: 700, color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-secondary)' }}>{i + 1}</span>

              {viewMode === 'list' && <Poster src={item.image} title={item.title} size="thumb" />}

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
                    <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36 }}>{displayNote.toFixed(1)}</span>
                    <div className="mr-note-bar">
                      <div className={`mr-note-bar-fill ${getNoteBarColor(displayNote)}`} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                </>
              )}

              {mode === 'simple' && (
                <div className="mr-flex mr-items-center mr-gap-3">
                  <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36 }}>{item.note.toFixed(1)}</span>
                  <div className="mr-note-bar">
                    <div className={`mr-note-bar-fill ${getNoteBarColor(item.note)}`} style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              )}

              {mode === 'time' && (
                <>
                  <span style={{ fontWeight: 600 }}>{item.note.toFixed(1)}</span>
                  <span style={{ fontWeight: 600, color: 'var(--mr-blue-light)' }}>{formatTime(item.timeMinutes)}</span>
                </>
              )}

              <div className="mr-flex mr-gap-1" style={{ justifyContent: 'flex-end' }}>
                <button
                  title="Editar" onClick={() => setModal(item)} disabled={isDeleting}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--mr-border)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mr-text-secondary)' }}
                >✏️</button>
                <button
                  title="Excluir" onClick={() => handleDelete(item.id)} disabled={isDeleting}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--mr-border)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mr-text-secondary)' }}
                >{isDeleting ? '⏳' : '🗑️'}</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <ItemModal item={modal === 'add' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />
      )}
    </div>
  );
}