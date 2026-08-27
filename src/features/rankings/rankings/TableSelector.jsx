import React from 'react';

export default function TableSelector({ tables, selectedIds, onChange }) {
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