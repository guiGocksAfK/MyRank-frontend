import { useCallback, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { tableName } from '../../../shared/tableTemplates';
import useDismiss from '../../../shared/components/useDismiss';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/** Menu "Tabelas: 3 de 3": escolhe quais tabelas entram no Unificado (pelo menos uma). */
export default function TableSelector({ tables, selectedIds, onChange }) {
  const { t } = useLanguage();
  const tr = t.rankings;
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const button = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, box, button);

  const count = tables.filter(table => selectedIds.includes(table.id)).length;

  function toggle(id) {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return;
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="rk-menu-box" ref={box}>
      <button
        ref={button}
        type="button"
        className="mr-btn mr-btn-outline mr-btn-sm"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(v => !v)}
      >
        {fmt(tr.tablesMenu, { n: count, total: tables.length })}
        <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />
      </button>

      {open && (
        <div className="mr-menu rk-menu" role="menu" aria-label={tr.tablesMenuLabel}>
          <div className="mr-menu-label" aria-hidden="true">{tr.tablesMenuLabel}</div>
          {tables.map(table => {
            const active = selectedIds.includes(table.id);
            const locked = active && selectedIds.length === 1;
            return (
              <button
                key={table.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={active}
                aria-disabled={locked}
                className="mr-menu-item"
                onClick={() => toggle(table.id)}
              >
                <span className="mr-menu-radio" aria-hidden="true" />
                {tableName(table.label)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
