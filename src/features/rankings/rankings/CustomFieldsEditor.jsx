import { Plus, X } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

const TYPES = ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN'];
const MAX_CUSTOM_FIELDS = 5;

/**
 * Campos próprios do Personalizado (até 5). Campo que já existe tem `id` e não
 * troca de tipo (o backend recusa); renomear e remover pode.
 */
export default function CustomFieldsEditor({ value, onChange, disabled = false }) {
  const { t } = useLanguage();
  const tc = t.rankings.customFields;

  const update = (index, patch) => onChange(value.map((field, i) => (i === index ? { ...field, ...patch } : field)));

  return (
    <div className="rk-subs">
      <span className="mr-field-label">{tc.label}</span>
      {value.length > 0 && (
        <ul className="rk-subs-list">
          {value.map((field, index) => (
            <li key={field.id ?? `new-${index}`}>
              <input
                className="mr-input"
                value={field.name}
                placeholder={tc.namePlaceholder}
                maxLength={40}
                onChange={event => update(index, { name: event.target.value })}
                disabled={disabled}
              />
              <select
                className="mr-input rk-field-type"
                value={field.type}
                onChange={event => update(index, { type: event.target.value })}
                disabled={disabled || !!field.id}
                title={field.id ? tc.typeLocked : undefined}
              >
                {TYPES.map(type => <option key={type} value={type}>{tc.types[type]}</option>)}
              </select>
              <button type="button" className="rk-icon-btn is-danger" aria-label={tc.remove} title={tc.remove}
                onClick={() => onChange(value.filter((_, i) => i !== index))} disabled={disabled}>
                <X size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.length < MAX_CUSTOM_FIELDS && (
        <button type="button" className="mr-btn mr-btn-ghost mr-btn-sm rk-add-link" onClick={() => onChange([...value, { name: '', type: 'TEXT' }])} disabled={disabled}>
          <Plus size={14} strokeWidth={2} aria-hidden="true" />
          {tc.add}
        </button>
      )}
    </div>
  );
}
