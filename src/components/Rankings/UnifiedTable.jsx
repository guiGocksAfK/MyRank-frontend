import React, { useMemo } from 'react';
import Poster from './Poster';
import { getNoteBarColor, formatTime, sortItems, getMode, applyFilters, getColumnConfig, badgeStyle } from '../../utils/formatters';

export default function UnifiedTable({ tables, selectedTableIds, sortBy, useTimeWeight, viewMode, filters }) {
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

  if (viewMode === 'grid') {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
          {sorted.map((item, i) => (
            <GridCardWrapper key={item.id + item._tableId} item={item} mode={mode} maxNote={maxNote} index={i} />
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
                style={{ gridTemplateColumns: cols.gridTemplate, borderLeft: i < 3 ? '3px solid var(--mr-gold)' : undefined }}
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

function GridCardWrapper({ item, mode, maxNote, index }) {
  const GridCard = require('./GridCard').default;
  return <GridCard item={item} mode={mode} maxNote={maxNote} index={index} showActions={false} />;
}