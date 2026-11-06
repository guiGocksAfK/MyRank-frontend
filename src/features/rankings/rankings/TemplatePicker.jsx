import { Check, Lock } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import InfoTip from '../../../shared/components/InfoTip';
import { TABLE_TEMPLATES, TEMPLATE_ICONS, tableName } from '../../../shared/tableTemplates';

/**
 * Tipos da tabela numa grade de cartões: marca um ou mais. `locked` são os tipos
 * que não dá pra desmarcar (a tabela já tem itens deles); o último marcado também
 * não sai.
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
    <div>
      <div className="rk-label-row">
        <span className="mr-field-label" id="rk-template-label">{tp.label}</span>
        <InfoTip label={tp.helpTitle} title={tp.helpTitle}>
          <span className="mr-infotip-text">{tp.helpIntro}</span>
          <span className="rk-help-list">
            {tp.helpSources.map(([types, source]) => (
              <span key={types}><span>{types}</span><span>{source}</span></span>
            ))}
          </span>
          <span className="mr-infotip-text">{tp.helpOther}</span>
          <span className="mr-infotip-text">{tp.helpMusic}</span>
        </InfoTip>
      </div>
      <div className="rk-type-grid" role="group" aria-labelledby="rk-template-label">
        {Object.entries(TABLE_TEMPLATES).map(([template, meta]) => {
          const selected = value.includes(template);
          const isLocked = selected && locked.includes(template);
          const Icon = TEMPLATE_ICONS[template];
          return (
            <button
              key={template}
              type="button"
              className={`rk-type${selected ? ' is-active' : ''}`}
              aria-pressed={selected}
              title={isLocked ? tp.locked : undefined}
              disabled={disabled}
              onClick={() => toggle(template)}
            >
              <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
              <span>{tableName(t.rankings.types[meta.type])}</span>
              {selected && (
                <span className="rk-type-badge" aria-hidden="true">
                  {isLocked ? <Lock size={11} strokeWidth={2} /> : <Check size={12} strokeWidth={2.4} />}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mr-field-hint">{tp.hint}</p>
    </div>
  );
}
