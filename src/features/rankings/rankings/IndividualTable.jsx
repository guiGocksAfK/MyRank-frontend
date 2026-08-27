import { useState, useMemo } from 'react';
import Poster from './Poster';
import GridCard from './GridCard';
import ItemModal from './ItemModal';
import ConfirmModal from './ConfirmModal';
import EditTableModal from './EditTableModal';
import AnimatedNumber from './AnimatedNumber';
import { getNoteBarColor, formatTime, sortItems, getMode, getDisplayedNote, applyFilters, getColumnConfig } from '../../../utils/formatters';

function TableToolbar({ table, onDeleteTable, onEditTable, onAddWork }) {
  return (
    <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-2" style={{ marginBottom: '1rem' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>
        {table.items.length} obra{table.items.length !== 1 ? 's' : ''}
      </span>
      <div className="mr-flex mr-gap-2">
        <button
          className="mr-btn mr-btn-outline mr-btn-sm"
          style={{ color: '#e24b4a', borderColor: 'rgba(226,75,74,0.35)' }}
          onClick={onDeleteTable}
        >
          🗑️ Excluir tabela
        </button>
        <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onEditTable}>
          ✏️ Editar tabela
        </button>
        <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={onAddWork}>
          ➕ Adicionar obra
        </button>
      </div>
    </div>
  );
}

export default function IndividualTable({ table, loading, sortBy, useTimeWeight, viewMode, filters, onSaveWork, onDeleteWork, onDeleteTable, onMoveItem, onRenameTable }) {
  const [modal, setModal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [showEditTable, setShowEditTable] = useState(false);
  const mode    = getMode(sortBy, useTimeWeight);
  const maxNote = mode === 'weight' ? 12 : 10;
  const cols    = getColumnConfig(mode, true, viewMode === 'list');

  const filteredItems = useMemo(() => applyFilters(table.items, filters), [table.items, filters]);
  const sorted = sortItems(filteredItems, sortBy, useTimeWeight);

  function canDropOn(target) {
    const draggedItem = sorted.find(item => item.id === draggedItemId);
    return sortBy !== 'time' && draggedItem && target.id !== draggedItem.id
      && getDisplayedNote(draggedItem, useTimeWeight) === getDisplayedNote(target, useTimeWeight);
  }

  function handleDragOver(event, target) {
    if (!canDropOn(target)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event, target) {
    event.preventDefault();
    if (canDropOn(target)) onMoveItem(table.id, draggedItemId, target.id);
    setDraggedItemId(null);
  }

  async function handleSave(payload) {
    await onSaveWork(table.id, payload);
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await onDeleteWork(table.id, id);
      return true;
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Erro ao excluir a obra.');
      return false;
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteTableClick() {
    try {
      await onDeleteTable(table.id);
      return true;
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Erro ao excluir a tabela.');
      return false;
    }
  }

  const toolbar = (
    <TableToolbar
      table={table}
      onEditTable={() => setShowEditTable(true)}
      onDeleteTable={() => setConfirmAction({ type: 'table' })}
      onAddWork={() => setModal('add')}
    />
  );

  if (viewMode === 'grid') {
    return (
      <div>
        {toolbar}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--mr-text-secondary)' }}>⏳ Carregando obras...</div>
        ) : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
          {sorted.map((item, i) => (
            <GridCard
              key={item.id} item={item} mode={mode} maxNote={maxNote} index={i}
              showActions={true}
              onEdit={(it) => setModal(it)}
              onDelete={id => setConfirmAction({ type: 'item', id })}
              draggable={sortBy !== 'time'}
              onDragStart={() => setDraggedItemId(item.id)}
              onDragEnd={() => setDraggedItemId(null)}
              onDragOver={event => handleDragOver(event, item)}
              onDrop={event => handleDrop(event, item)}
              isDragging={draggedItemId === item.id}
            />
          ))}
        </div>}
        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
            Nenhuma obra encontrada com os filtros atuais. 🔍
          </div>
        )}
        {modal && (
          <ItemModal item={modal === 'add' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />
        )}
        {confirmAction?.type === 'item' && (
          <ConfirmModal
            title="Remover esta obra?"
            message="A obra será removida deste ranking e essa ação não poderá ser desfeita."
            onConfirm={() => handleDelete(confirmAction.id)}
            onClose={() => setConfirmAction(null)}
          />
        )}
        {confirmAction?.type === 'table' && (
          <ConfirmModal
            title="Excluir tabela?"
            message={`A tabela "${table.label}" e todos os seus itens serão excluídos. Essa ação não poderá ser desfeita.`}
            onConfirm={handleDeleteTableClick}
            onClose={() => setConfirmAction(null)}
          />
        )}
        {showEditTable && (
          <EditTableModal
            table={table}
            onSave={name => onRenameTable(table.id, name)}
            onClose={() => setShowEditTable(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {toolbar}

      <div className="mr-table-header" style={{ gridTemplateColumns: cols.gridTemplate }}>
        {cols.headers.map((h, i) => <span key={i}>{h}</span>)}
      </div>

      <div className="mr-space-y-2">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--mr-text-secondary)' }}>⏳ Carregando obras...</div>
        ) : sorted.length === 0 && (
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
              className="mr-table-row mr-rankings-enter"
              key={item.id}
              draggable={sortBy !== 'time'}
              onDragStart={() => setDraggedItemId(item.id)}
              onDragEnd={() => setDraggedItemId(null)}
              onDragOver={event => handleDragOver(event, item)}
              onDrop={event => handleDrop(event, item)}
              style={{ gridTemplateColumns: cols.gridTemplate, '--rank-delay': `${Math.min(i, 12) * 35}ms`, borderLeft: i < 3 ? '3px solid var(--mr-gold)' : undefined, opacity: isDeleting ? 0.5 : (draggedItemId === item.id ? 0.45 : 1), cursor: sortBy !== 'time' ? 'grab' : undefined }}
            >
              <span style={{ fontWeight: 700, color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-secondary)' }}>{i + 1}</span>

              {viewMode === 'list' && <Poster src={item.image} title={item.title} size="thumb" />}

              <div className="mr-min-w-0">
                <div className="mr-truncate" style={{ fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>{item.sub}</div>
              </div>

              {mode === 'weight' && (
                <>
                  <span style={{ fontWeight: 600 }}><AnimatedNumber value={item.note} /></span>
                  <span style={{ color: 'var(--mr-blue-light)', fontWeight: 500, fontSize: '0.875rem' }}>
                    {bonus > 0 ? <AnimatedNumber value={bonus} prefix="+" /> : '—'}
                  </span>
                  <div className="mr-flex mr-items-center mr-gap-3">
                    <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36 }}><AnimatedNumber value={displayNote} /></span>
                    <div className="mr-note-bar">
                      <div className={`mr-note-bar-fill ${getNoteBarColor(displayNote)}`} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                </>
              )}

              {mode === 'simple' && (
                <div className="mr-flex mr-items-center mr-gap-3">
                  <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 36 }}><AnimatedNumber value={item.note} /></span>
                  <div className="mr-note-bar">
                    <div className={`mr-note-bar-fill ${getNoteBarColor(item.note)}`} style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              )}

              {mode === 'time' && (
                <>
                  <span style={{ fontWeight: 600 }}><AnimatedNumber value={item.note} /></span>
                  <span style={{ fontWeight: 600, color: 'var(--mr-blue-light)' }}>{formatTime(item.timeMinutes)}</span>
                </>
              )}

              <div className="mr-flex mr-gap-1" style={{ justifyContent: 'flex-end' }}>
                <button
                  title="Editar" onClick={() => setModal(item)} disabled={isDeleting}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--mr-border)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mr-text-secondary)' }}
                >✏️</button>
                <button
                  title="Excluir" onClick={() => setConfirmAction({ type: 'item', id: item.id })} disabled={isDeleting}
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
      {confirmAction?.type === 'item' && (
        <ConfirmModal
          title="Remover esta obra?"
          message="A obra será removida deste ranking e essa ação não poderá ser desfeita."
          onConfirm={() => handleDelete(confirmAction.id)}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === 'table' && (
        <ConfirmModal
          title="Excluir tabela?"
          message={`A tabela "${table.label}" e todos os seus itens serão excluídos. Essa ação não poderá ser desfeita.`}
          onConfirm={handleDeleteTableClick}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {showEditTable && (
        <EditTableModal
          table={table}
          onSave={name => onRenameTable(table.id, name)}
          onClose={() => setShowEditTable(false)}
        />
      )}
    </div>
  );
}