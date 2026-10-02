import { useLanguage } from '../../../shared/i18n';
import { TABLE_TEMPLATES } from '../../../shared/tableTemplates';

/**
 * Tipos da tabela em chips: marca um ou mais. `locked` são os tipos que não dá
 * pra desmarcar (a tabela já tem itens deles); o último marcado também não sai.
 */
export default function TemplatePicker({ value, onChange, locked = [], disabled = false }) {
  const { t } = useLanguage();
  const tp = t.rankings.templatePicker;

  function toggle(template) {
    if (value.includes(template)) {
      if (value.length === 1 || locked.includes(template)) return;
      onChange(value.filter(v => v !== template));
    } else {
      onChange([...value, template]);
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 6 }}>
        {tp.label}
      </span>
      <div role="group" aria-label={tp.label} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Object.entries(TABLE_TEMPLATES).map(([template, meta]) => {
          const selected = value.includes(template);
          const isLocked = selected && locked.includes(template);
          return (
            <button
              key={template}
              type="button"
              aria-pressed={selected}
              title={isLocked ? tp.locked : undefined}
              disabled={disabled}
              onClick={() => toggle(template)}
              style={{
                padding: '5px 10px', borderRadius: 999, fontSize: '0.8rem', cursor: disabled ? 'default' : 'pointer',
                border: `1px solid ${selected ? 'var(--mr-gold)' : 'var(--mr-border)'}`,
                background: selected ? 'var(--mr-gold-10, rgba(212,175,55,0.1))' : 'transparent',
                color: selected ? 'var(--mr-text)' : 'var(--mr-text-secondary)',
              }}
            >
              {t.rankings.types[meta.type]}{isLocked ? ' 🔒' : ''}
            </button>
          );
        })}
      </div>
      <span style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', display: 'block', marginTop: 6 }}>
        {tp.hint}
      </span>
    </div>
  );
}

