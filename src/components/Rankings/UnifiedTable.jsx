import { useMemo, useState } from 'react';
import Poster from './Poster';
import GridCard from './GridCard';
import AnimatedNumber from './AnimatedNumber';
import { getNoteBarColor, formatTime, sortItems, getMode, applyFilters, getColumnConfig, badgeStyle } from '../../utils/formatters';

function getUnifiedOrderKey() {
  const userKey = localStorage.getItem('myrank_username') || 'anonymous';
  return `myrank_unified_item_order_${userKey}`;
}

function getItemKey(item) {
  return `${item._tableId}:${item.id}`;
}

function readUnifiedOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(getUnifiedOrderKey()) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function applyUnifiedOrder(items, savedOrder) {
  const itemByKey = new Map(items.map(item => [getItemKey(item), item]));
  const ordered = savedOrder.map(key => itemByKey.get(key)).filter(Boolean);
  const orderedKeys = new Set(ordered.map(getItemKey));
  return [...ordered, ...items.filter(item => !orderedKeys.has(getItemKey(item)))];
}

export default function UnifiedTable({ tables, selectedTableIds, loading, sortBy, useTimeWeight, viewMode, filters }) {
  const mode    = getMode(sortBy, useTimeWeight);
  const maxNote = mode === 'weight' ? 12 : 10;
  const cols    = getColumnConfig(mode, false, viewMode === 'list');
  const [unifiedOrder, setUnifiedOrder] = useState(readUnifiedOrder);
  const [draggedItemKey, setDraggedItemKey] = useState(null);

  const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));

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

  function handleDrop(event, target) {
    event.preventDefault();
    if (!canDropOn(target)) {
      setDraggedItemKey(null);
      return;
    }

    const draggedIndex = orderedItems.findIndex(item => getItemKey(item) === draggedItemKey);
    const targetIndex = orderedItems.findIndex(item => getItemKey(item) === getItemKey(target));
    if (draggedIndex < 0 || targetIndex < 0) return;

    const nextItems = [...orderedItems];
    const [draggedItem] = nextItems.splice(draggedIndex, 1);
    const targetPosition = nextItems.findIndex(item => getItemKey(item) === getItemKey(target));
    const insertIndex = draggedIndex < targetIndex ? targetPosition + 1 : targetPosition;
    nextItems.splice(insertIndex, 0, draggedItem);
    const nextOrder = nextItems.map(getItemKey);
    setUnifiedOrder(nextOrder);
    localStorage.setItem(getUnifiedOrderKey(), JSON.stringify(nextOrder));
    setDraggedItemKey(null);
  }

  if (viewMode === 'grid') {
    return (
      <div key="unified-grid-view">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
          {sorted.map((item, i) => (
            <GridCard
              key={getItemKey(item)}
              item={item} mode={mode} maxNote={maxNote} index={i} showActions={false}
              draggable={sortBy !== 'time'}
              onDragStart={() => setDraggedItemKey(getItemKey(item))}
              onDragEnd={() => setDraggedItemKey(null)}
              onDragOver={event => handleDragOver(event, item)}
              onDrop={event => handleDrop(event, item)}
              isDragging={draggedItemKey === getItemKey(item)}
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

  return (
    <div key="unified-list-view">
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
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--mr-text-secondary)' }}>⏳ Carregando obras...</div>
          ) : sorted.map((item, i) => {
            const displayNote = mode === 'weight' ? item.finalNote : item.note;
            const bonus       = mode === 'weight' ? item.bonusTime : 0;
            const barWidth    = Math.min((displayNote / maxNote) * 100, 100);

            return (
              <div
                className="mr-table-row mr-rankings-enter"
                key={getItemKey(item)}
                draggable={sortBy !== 'time'}
                onDragStart={() => setDraggedItemKey(getItemKey(item))}
                onDragEnd={() => setDraggedItemKey(null)}
                onDragOver={event => handleDragOver(event, item)}
                onDrop={event => handleDrop(event, item)}
                style={{ gridTemplateColumns: cols.gridTemplate, '--rank-delay': `${Math.min(i, 12) * 35}ms`, borderLeft: i < 3 ? '3px solid var(--mr-gold)' : undefined, opacity: draggedItemKey === getItemKey(item) ? 0.45 : 1, cursor: sortBy !== 'time' ? 'grab' : undefined }}
              >
                <span style={{ fontWeight: 700, color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-secondary)' }}>{i + 1}</span>

                {viewMode === 'list' && <Poster src={item.image} title={item.title} size="thumb" />}

                <div className="mr-min-w-0">
                  <div className="mr-truncate" style={{ fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>{item.sub}</div>
                </div>
                <span className="mr-badge mr-badge-outline" style={badgeStyle}>{item._tableLabel}</span>

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
              </div>
            );
          })}
        </div>

        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
            Nenhuma obra encontrada com os filtros atuais. 🔍
          </div>
        )}
      </div>
    </div>
  );
}