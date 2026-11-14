import { useState, useMemo } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Poster from './Poster';
import GridCard from './GridCard';
import ItemModal from './ItemModal';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import EditTableModal from './EditTableModal';
import { RankHeader, ReorderButtons, ScoreCells } from './rankRow';
import { rowColumns } from './rankColumns';
import { sortItems, getMode, getDisplayedNote, applyFilters } from '../../../utils/formatters';
import { useLanguage } from '../../../shared/i18n';
import { itemSubline } from '../../../shared/tableTemplates';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

export default function IndividualTable({ table, loading, sortBy, useTimeWeight, viewMode, filters, controls, panel, reordering, onSaveWork, onDeleteWork, onDeleteTable, onMoveItem, onRenameTable, onAddSubcategory, onRenameSubcategory, onDeleteSubcategory }) {
  const { t, locale } = useLanguage();
  const tr = t.rankings;
  const [modal, setModal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [showEditTable, setShowEditTable] = useState(false);
  const mode    = getMode(sortBy, useTimeWeight);

  const subcategories = table.subcategories;
  // o filtro de subcategoria mora na barra de filtros (filters.subcategory)
  const subFilter = filters.subcategory ?? 'all';

  const filteredItems = useMemo(() => applyFilters(table.items, filters), [table.items, filters]);
  const sorted = useMemo(
    () => sortItems(filteredItems, sortBy, useTimeWeight),
    [filteredItems, sortBy, useTimeWeight],
  );

  // Adicionar obra com uma subcategoria filtrada já deixa ela selecionada.
  const defaultSubcategoryId = typeof subFilter === 'number' ? subFilter : null;

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

  /** Modo "Reordenar" (celular, sem arrastar): troca com a vizinha de mesma nota. */
  const canMoveRow = (index, dir) => {
    const neighbor = sorted[index + (dir === 'up' ? -1 : 1)];
    return sortBy !== 'time' && !!neighbor
      && getDisplayedNote(sorted[index], useTimeWeight) === getDisplayedNote(neighbor, useTimeWeight);
  };
  const moveRow = (index, dir) => {
    if (!canMoveRow(index, dir)) return;
    onMoveItem(table.id, sorted[index].id, sorted[index + (dir === 'up' ? -1 : 1)].id);
  };

  async function handleSave(payload) {
    await onSaveWork(table.id, payload);
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await onDeleteWork(table.id, id);
      return true;
    } catch (err) {
      throw new Error(err?.response?.data?.message || err.message || tr.deleteWorkError, { cause: err });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteTableClick() {
    try {
      await onDeleteTable(table.id);
      return true;
    } catch (err) {
      throw new Error(err?.response?.data?.message || err.message || tr.deleteTableError, { cause: err });
    }
  }

  const count = table.items.length;
  const empty = !loading && sorted.length === 0 && (
    <p className="rk-empty">{count === 0 ? tr.emptyTable : tr.noResults}</p>
  );

  return (
    <div>
      <div className="rk-controls">
        {controls}
        <div className="rk-controls-end">
          <span className="rk-count">{fmt(sorted.length === 1 ? tr.worksOne : tr.worksMany, { n: sorted.length })}</span>
          <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => setShowEditTable(true)}>
            <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
            {tr.toolbar.editTable}
          </button>
          <button type="button" className="mr-btn mr-btn-gold mr-btn-sm" onClick={() => setModal('add')}>
            <Plus size={15} strokeWidth={2} aria-hidden="true" />
            {tr.toolbar.addWork}
          </button>
        </div>
      </div>

      {panel}

      {viewMode === 'grid' ? (
        loading ? <p className="rk-empty">{tr.loadingWorks}</p> : (
          <div className="rk-grid">
            {sorted.map((item, i) => (
              <GridCard
                key={item.id} item={item} mode={mode} index={i}
                customFields={table.customFields}
                showActions={true}
                onClick={() => setModal(item)}
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
          </div>
        )
      ) : (
        <>
          <RankHeader mode={mode} labels={tr.cols} actions reordering={reordering} />
          {loading ? (
            <p className="rk-empty">{tr.loadingWorks}</p>
          ) : sorted.map((item, i) => {
            const isDeleting = deletingId === item.id;
            return (
              <div
                className={`rk-row mr-rankings-enter${i < 3 ? ' is-top' : ''}`}
                key={item.id}
                draggable={sortBy !== 'time'}
                onDragStart={() => setDraggedItemId(item.id)}
                onDragEnd={() => setDraggedItemId(null)}
                onDragOver={event => handleDragOver(event, item)}
                onDrop={event => handleDrop(event, item)}
                style={{
                  '--rk-cols': rowColumns(mode, { actions: true, reordering }),
                  '--rank-delay': `${Math.min(i, 8) * 18}ms`,
                  opacity: isDeleting ? 0.5 : (draggedItemId === item.id ? 0.45 : 1),
                }}
              >
                <span className="rk-rank">{i + 1}</span>
                <Poster src={item.image} title={item.title} template={item.template} size="thumb" />
                <div className="rk-main">
                  <div className="rk-title">{item.title}</div>
                  <div className="rk-sub">
                    {itemSubline(item, tr, table.customFields)}
                    {/* Em "Todas", mostra de qual subcategoria a obra é */}
                    {subFilter === 'all' && item.subcategoryName && (
                      <span className="mr-subcategory-tag">{item.subcategoryName}</span>
                    )}
                  </div>
                </div>
                <ScoreCells item={item} mode={mode} locale={locale} />
                {reordering && (
                  <ReorderButtons
                    canUp={canMoveRow(i, 'up')} canDown={canMoveRow(i, 'down')}
                    onUp={() => moveRow(i, 'up')} onDown={() => moveRow(i, 'down')}
                    labels={tr}
                  />
                )}
                <div className="rk-actions">
                  <button type="button" className="rk-icon-btn" title={tr.edit} aria-label={tr.edit}
                    onClick={() => setModal(item)} disabled={isDeleting}>
                    <Pencil size={15} strokeWidth={1.7} aria-hidden="true" />
                  </button>
                  <button type="button" className="rk-icon-btn is-danger" title={tr.delete} aria-label={tr.delete}
                    onClick={() => setConfirmAction({ type: 'item', id: item.id })} disabled={isDeleting}>
                    <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {empty}

      {modal && (
        <ItemModal
          item={modal === 'add' ? null : modal}
          templates={table.templates}
          customFields={table.customFields}
          subcategories={subcategories}
          defaultSubcategoryId={defaultSubcategoryId}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {confirmAction?.type === 'item' && (
        <ConfirmModal
          title={tr.confirm.removeWorkTitle}
          message={tr.confirm.removeWorkMsg}
          onConfirm={() => handleDelete(confirmAction.id)}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === 'table' && (
        <ConfirmModal
          title={tr.confirm.deleteTableTitle}
          message={fmt(tr.confirm.deleteTableMsg, { label: table.label })}
          onConfirm={handleDeleteTableClick}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {showEditTable && (
        <EditTableModal
          table={table}
          onSave={name => onRenameTable(table.id, name)}
          onAddSubcategory={name => onAddSubcategory(table.id, name)}
          onRenameSubcategory={(subId, name) => onRenameSubcategory(table.id, subId, name)}
          onDeleteSubcategory={subId => onDeleteSubcategory(table.id, subId)}
          onDeleteTable={() => { setShowEditTable(false); setConfirmAction({ type: 'table' }); }}
          onClose={() => setShowEditTable(false)}
        />
      )}
    </div>
  );
}
