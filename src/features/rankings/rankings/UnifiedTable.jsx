import { useMemo, useState } from 'react';
import Poster from './Poster';
import GridCard from './GridCard';
import { RankHeader, ReorderButtons, ScoreCells } from './rankRow';
import { rowColumns } from './rankColumns';
import { sortItems, getMode, applyFilters } from '../../../utils/formatters';
import { useLanguage } from '../../../shared/i18n';
import { itemSubline, tableName } from '../../../shared/tableTemplates';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

function getItemKey(item) {
  return `${item._tableId}:${item.id}`;
}

function applyUnifiedOrder(items, savedOrder) {
  const itemByKey = new Map(items.map(item => [getItemKey(item), item]));
  const ordered = savedOrder.map(key => itemByKey.get(key)).filter(Boolean);
  const orderedKeys = new Set(ordered.map(getItemKey));
  return [...ordered, ...items.filter(item => !orderedKeys.has(getItemKey(item)))];
}

export default function UnifiedTable({ tables, selectedTableIds, loading, sortBy, useTimeWeight, viewMode, filters, manualOrder = [], onReorder, controls, panel, reordering, onOpenTable }) {
  const { t, locale } = useLanguage();
  const tr = t.rankings;
  const mode    = getMode(sortBy, useTimeWeight);
  // ordem vinda do backend (via prop); localOrder é o override otimista durante o drag
  const [localOrder, setLocalOrder] = useState(null);
  const unifiedOrder = localOrder ?? manualOrder;
  const [draggedItemKey, setDraggedItemKey] = useState(null);
  // obra clicada: o Unificado não edita, então aparece a dica com o atalho pra tabela dela
  const [hint, setHint] = useState(null);

  // memorizado: sem isso a lista nascia nova a cada render e refazia todas as contas abaixo
  const selectedTables = useMemo(
    () => tables.filter(table => selectedTableIds.includes(table.id)),
    [tables, selectedTableIds],
  );

  const allItems = useMemo(() => {
    const uniqueItems = new Map();
    selectedTables.forEach(table => {
      table.items.forEach(item => {
        const unifiedItem = { ...item, _tableLabel: table.label, _tableId: table.id };
        const key = getItemKey(unifiedItem);
        if (!uniqueItems.has(key)) uniqueItems.set(key, unifiedItem);
      });
    });
    return [...uniqueItems.values()];
  },
  [selectedTables]);

  const orderedItems = useMemo(() => applyUnifiedOrder(allItems, unifiedOrder), [allItems, unifiedOrder]);
  const filteredItems = useMemo(() => applyFilters(orderedItems, filters), [orderedItems, filters]);
  const sorted = sortItems(filteredItems, sortBy, useTimeWeight);

  function canDropOn(target) {
    const draggedItem = sorted.find(item => getItemKey(item) === draggedItemKey);
    return sortBy !== 'time' && draggedItem && getItemKey(target) !== draggedItemKey
      && (useTimeWeight ? draggedItem.finalNote : draggedItem.note) === (useTimeWeight ? target.finalNote : target.note);
  }

  function handleDragOver(event, target) {
    if (!canDropOn(target)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  /** Move draggedKey pra posição de targetKey dentro da ordem manual e persiste. */
  function applyMove(draggedKey, targetKey) {
    const draggedIndex = orderedItems.findIndex(item => getItemKey(item) === draggedKey);
    const targetIndex = orderedItems.findIndex(item => getItemKey(item) === targetKey);
    if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) return;

    const nextItems = [...orderedItems];
    const [draggedItem] = nextItems.splice(draggedIndex, 1);
    const targetPosition = nextItems.findIndex(item => getItemKey(item) === targetKey);
    const insertIndex = draggedIndex < targetIndex ? targetPosition + 1 : targetPosition;
    nextItems.splice(insertIndex, 0, draggedItem);
    const nextOrder = nextItems.map(getItemKey);
    setLocalOrder(nextOrder);
    onReorder?.(nextOrder);
  }

  function handleDrop(event, target) {
    event.preventDefault();
    if (canDropOn(target)) applyMove(draggedItemKey, getItemKey(target));
    setDraggedItemKey(null);
  }

  const noteOf = (item) => (useTimeWeight ? item.finalNote : item.note);

  const canMoveRow = (index, dir) => {
    const neighbor = sorted[index + (dir === 'up' ? -1 : 1)];
    return sortBy !== 'time' && !!neighbor && noteOf(sorted[index]) === noteOf(neighbor);
  };

  function moveRow(index, dir) {
    if (!canMoveRow(index, dir)) return;
    applyMove(getItemKey(sorted[index]), getItemKey(sorted[index + (dir === 'up' ? -1 : 1)]));
  }

  const showHint = (item) => setHint({ id: item._tableId, label: tableName(item._tableLabel) });

  const empty = !loading && sorted.length === 0 && (
    <p className="rk-empty">{selectedTables.length === 0 ? tr.selectTablesHint : tr.noResults}</p>
  );

  return (
    <div>
      <div className="rk-controls">
        {controls}
        <span className="rk-count">{fmt(sorted.length === 1 ? tr.worksOne : tr.worksMany, { n: sorted.length })}</span>
      </div>

      {panel}

      {hint && (
        <div className="rk-hint" role="status">
          <span>{tr.unifiedHint}</span>
          <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => onOpenTable?.(hint.id)}>
            {fmt(tr.openTable, { label: hint.label })}
          </button>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="rk-grid">
          {sorted.map((item, i) => (
            <GridCard
              key={getItemKey(item)}
              item={item} mode={mode} index={i} unified showActions={false}
              onClick={() => showHint(item)}
              draggable={sortBy !== 'time'}
              onDragStart={() => setDraggedItemKey(getItemKey(item))}
              onDragEnd={() => setDraggedItemKey(null)}
              onDragOver={event => handleDragOver(event, item)}
              onDrop={event => handleDrop(event, item)}
              isDragging={draggedItemKey === getItemKey(item)}
            />
          ))}
        </div>
      ) : (
        <>
          <RankHeader mode={mode} labels={tr.cols} unified reordering={reordering} />
          {loading ? (
            <p className="rk-empty">{tr.loadingWorks}</p>
          ) : sorted.map((item, i) => (
            <div
              className={`rk-row mr-rankings-enter${i < 3 ? ' is-top' : ''}`}
              key={getItemKey(item)}
              draggable={sortBy !== 'time'}
              onClick={() => showHint(item)}
              onDragStart={() => setDraggedItemKey(getItemKey(item))}
              onDragEnd={() => setDraggedItemKey(null)}
              onDragOver={event => handleDragOver(event, item)}
              onDrop={event => handleDrop(event, item)}
              style={{
                '--rk-cols': rowColumns(mode, { unified: true, reordering }),
                '--rank-delay': `${Math.min(i, 12) * 35}ms`,
                opacity: draggedItemKey === getItemKey(item) ? 0.45 : 1,
              }}
            >
              <span className="rk-rank">{i + 1}</span>
              <Poster src={item.image} title={item.title} size="thumb" />
              <div className="rk-main">
                <div className="rk-title">{item.title}</div>
                <div className="rk-sub">{itemSubline(item, tr)}</div>
              </div>
              <span className="rk-table rk-hide-mobile">{tableName(item._tableLabel)}</span>
              <ScoreCells item={item} mode={mode} locale={locale} />
              {reordering && (
                <ReorderButtons
                  canUp={canMoveRow(i, 'up')} canDown={canMoveRow(i, 'down')}
                  onUp={(e) => { e?.stopPropagation?.(); moveRow(i, 'up'); }}
                  onDown={(e) => { e?.stopPropagation?.(); moveRow(i, 'down'); }}
                  labels={tr}
                />
              )}
            </div>
          ))}
        </>
      )}

      {empty}
    </div>
  );
}
