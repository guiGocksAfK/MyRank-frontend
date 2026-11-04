import { useState } from 'react';
import { Layers, Plus, X } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import CollapsibleField from './CollapsibleField';

const MAX_SUBCATEGORIES = 20; // o backend barra a 21ª

/**
 * Subcategorias de uma tabela, numa linha que abre e fecha. Nada vai pro servidor
 * aqui: o modal aplica tudo no Criar/Salvar (Cancelar desfaz de verdade). Remover
 * uma que já existe só risca a linha, com Desfazer, até salvar. `counts` (obras por
 * subcategoria) só existe no Editar; sem ele é a criação da tabela.
 */
export default function SubcategoryEditor({ value, onChange, counts = null, disabled = false }) {
  const { t } = useLanguage();
  const ts = t.rankings.subcategories;
  const [open, setOpen] = useState(false);
  const [focusKey, setFocusKey] = useState(null);
  const active = value.filter(sub => !sub.removed);
  const canAdd = active.length < MAX_SUBCATEGORIES;

  const update = (key, patch) => onChange(value.map(sub => (sub.key === key ? { ...sub, ...patch } : sub)));
  const newRow = () => {
    const key = `new-${Date.now()}`;
    setFocusKey(key);
    return { key, id: null, name: '', removed: false };
  };
  const add = () => onChange([...value, newRow()]);
  // linha nova que não chegou a existir some de vez; a que existe fica riscada
  const remove = sub => (sub.id ? update(sub.key, { removed: true }) : onChange(value.filter(s => s.key !== sub.key)));

  function toggle() {
    // abrir sem nenhuma já cria a primeira linha, com o cursor nela
    if (!open && value.length === 0) onChange([newRow()]);
    setOpen(v => !v);
  }

  const names = active.map(sub => sub.name.trim()).filter(Boolean);
  const summary = open
    ? ts.count.replace('{n}', active.length).replace('{max}', MAX_SUBCATEGORIES)
    : names.length === 0
      ? ts.none
      : names.slice(0, 2).join(', ') + (names.length > 2 ? ` ${ts.more.replace('{n}', names.length - 2)}` : '');

  return (
    <CollapsibleField icon={Layers} title={ts.heading} summary={summary} open={open} onToggle={toggle}>
      {value.length > 0 && (
        <ul className="rk-fields">
          {value.map(sub => {
            const n = counts && sub.id ? counts[sub.id] ?? 0 : null;
            return (
              <li key={sub.key} className={sub.removed ? 'is-removed' : undefined}>
                {sub.removed ? (
                  <>
                    <span className="rk-fields-name rk-sub-removed">
                      <s>{sub.name}</s> <em>({ts.removed})</em>
                    </span>
                    <button type="button" className="mr-btn mr-btn-ghost mr-btn-sm" onClick={() => update(sub.key, { removed: false })} disabled={disabled}>
                      {ts.undo}
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      className="rk-fields-name"
                      aria-label={ts.rename}
                      value={sub.name}
                      placeholder={ts.placeholder}
                      maxLength={60}
                      autoFocus={sub.key === focusKey}
                      onChange={event => update(sub.key, { name: event.target.value })}
                      onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (canAdd) add(); } }}
                      disabled={disabled}
                    />
                    {n !== null && <span className="rk-sub-count">{(n === 1 ? ts.works[0] : ts.works[1]).replace('{n}', n)}</span>}
                    <button type="button" className="rk-icon-btn is-danger" title={ts.remove} aria-label={`${ts.remove} ${sub.name}`}
                      onClick={() => remove(sub)} disabled={disabled}>
                      <X size={16} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="rk-coll-foot">
        {canAdd && (
          <button type="button" className="mr-btn mr-btn-ghost mr-btn-sm rk-add-link" onClick={add} disabled={disabled}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            {ts.add}
          </button>
        )}
        <p className="mr-field-hint">{counts ? ts.hintEdit : ts.hintNew}</p>
      </div>
    </CollapsibleField>
  );
}

