import { useLanguage } from '../../../shared/i18n';

const TYPES = ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN'];
const MAX_CUSTOM_FIELDS = 5;

/**
 * Campos próprios do Personalizado (até 5). Campo que já existe tem `id` e não
 * troca de tipo (o backend recusa); renomear e remover pode. Visual simples de
 * propósito: o acabamento fica pro remaster.
 */
export default function CustomFieldsEditor({ value, onChange, disabled = false }) {
  const { t } = useLanguage();
  const tc = t.rankings.customFields;

  const update = (index, patch) => onChange(value.map((field, i) => (i === index ? { ...field, ...patch } : field)));

  const inputStyle = {
    padding: '6px 8px', borderRadius: 6, border: '1px solid var(--mr-border)',
    background: 'var(--mr-bg)', color: 'var(--mr-text)', fontSize: '0.8rem',
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 6 }}>
        {tc.label}
      </span>
      {value.map((field, index) => (
        <div key={field.id ?? `new-${index}`} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input
            value={field.name}
            placeholder={tc.namePlaceholder}
            maxLength={40}
            onChange={e => update(index, { name: e.target.value })}
            style={{ ...inputStyle, flex: 1, minWidth: 0 }}
            disabled={disabled}
          />
          <select
            value={field.type}
            onChange={e => update(index, { type: e.target.value })}
            style={inputStyle}
            disabled={disabled || !!field.id}
            title={field.id ? tc.typeLocked : undefined}
          >
            {TYPES.map(type => <option key={type} value={type}>{tc.types[type]}</option>)}
          </select>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            disabled={disabled}
            aria-label={tc.remove}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >✕</button>
        </div>
      ))}
      {value.length < MAX_CUSTOM_FIELDS && (
        <button
          type="button"
          onClick={() => onChange([...value, { name: '', type: 'TEXT' }])}
          disabled={disabled}
          style={{ padding: 0, border: 0, background: 'none', color: 'var(--mr-gold)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
        >
          {tc.add}
        </button>
      )}
    </div>
  );
}
