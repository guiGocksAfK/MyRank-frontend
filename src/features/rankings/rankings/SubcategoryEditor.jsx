import { useState } from 'react';
import { Layers, X } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import CollapsibleField from './CollapsibleField';

const MAX_SUBCATEGORIES = 20; // o backend barra a 21ª

/**
 * Subcategorias como etiquetas, numa linha que abre e fecha. Nada vai pro servidor
 * aqui: o modal aplica tudo no Criar/Salvar (Cancelar desfaz de verdade).
 * - "+ Nova" é um campo na própria fileira: Enter (ou clicar fora) vira etiqueta.
 * - clique duplo renomeia; × de uma que já existe só risca, e clicar nela desfaz.
 * `counts` (obras por subcategoria) só existe no Editar; sem ele é a criação.
 */
export default function SubcategoryEditor({ value, onChange, counts = null, disabled = false }) {
  const { t } = useLanguage();
  const ts = t.rankings.subcategories;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(null); // { key, name }
  const active = value.filter(sub => !sub.removed);
  const canAdd = active.length < MAX_SUBCATEGORIES;

  const update = (key, patch) => onChange(value.map(sub => (sub.key === key ? { ...sub, ...patch } : sub)));
  const taken = name => value.some(sub => !sub.removed && sub.name.trim().toLowerCase() === name.toLowerCase());

  function commitDraft() {
    const name = draft.trim();
    if (!name) return;
    if (!taken(name)) onChange([...value, { key: `new-${Date.now()}`, id: null, name, removed: false }]);
    setDraft('');
  }

  function commitRename() {
    if (!editing) return;
    const name = editing.name.trim();
    const current = value.find(sub => sub.key === editing.key);
    if (current && name && name !== current.name && !taken(name)) update(editing.key, { name });
    setEditing(null);
  }

  // etiqueta nova que nem chegou a existir some de vez; a que existe fica riscada
  const remove = sub => (sub.id ? update(sub.key, { removed: true }) : onChange(value.filter(s => s.key !== sub.key)));

  const names = active.map(sub => sub.name);
  const summary = open
    ? ts.count.replace('{n}', active.length).replace('{max}', MAX_SUBCATEGORIES)
    : names.length === 0
      ? ts.none
      : names.slice(0, 2).join(', ') + (names.length > 2 ? ` ${ts.more.replace('{n}', names.length - 2)}` : '');

  return (
    <CollapsibleField icon={Layers} title={ts.heading} summary={summary} open={open} onToggle={() => setOpen(v => !v)}>
      <div className="rk-chips">
        {value.map(sub => {
          if (editing?.key === sub.key) {
            return (
              <input
                key={sub.key}
                className="rk-chip-input"
                aria-label={sub.name}
                value={editing.name}
                maxLength={60}
                size={Math.max(editing.name.length, 4)}
                autoFocus
                onChange={event => setEditing({ key: sub.key, name: event.target.value })}
                onBlur={commitRename}
                onKeyDown={event => {
                  if (event.key === 'Enter') { event.preventDefault(); commitRename(); }
                  if (event.key === 'Escape') { event.stopPropagation(); setEditing(null); }
                }}
              />
            );
          }
          const n = counts && sub.id ? counts[sub.id] ?? 0 : null;
          if (sub.removed) {
            return (
              <button key={sub.key} type="button" className="rk-chip is-removed" title={ts.undo} aria-label={`${sub.name}, ${ts.removed}. ${ts.undo}`}
                onClick={() => update(sub.key, { removed: false })} disabled={disabled}>
                <s>{sub.name}</s>
              </button>
            );
          }
          return (
            <span key={sub.key} className="rk-chip">
              <span className="rk-chip-name" title={ts.rename}
                onDoubleClick={() => !disabled && setEditing({ key: sub.key, name: sub.name })}>
                {sub.name}
                {n !== null && <em>{(n === 1 ? ts.works[0] : ts.works[1]).replace('{n}', n)}</em>}
              </span>
              <button type="button" className="rk-chip-x" aria-label={`${ts.remove} ${sub.name}`} title={ts.remove}
                onClick={() => remove(sub)} disabled={disabled}>
                <X size={12} strokeWidth={2} aria-hidden="true" />
              </button>
            </span>
          );
        })}
        {canAdd && (
          <input
            className="rk-chip-new"
            aria-label={ts.newLabel}
            placeholder={ts.newChip}
            value={draft}
            maxLength={60}
            size={Math.max(draft.length, ts.newChip.length)}
            autoFocus={value.length === 0}
            onChange={event => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={event => {
              if (event.key === 'Enter') { event.preventDefault(); commitDraft(); }
              if (event.key === 'Escape' && draft) { event.stopPropagation(); setDraft(''); }
            }}
            disabled={disabled}
          />
        )}
      </div>
      <p className="mr-field-hint rk-chips-hint">
        {ts.hintNew}{counts && ` ${ts.hintEdit}`}
      </p>
    </CollapsibleField>
  );
}
