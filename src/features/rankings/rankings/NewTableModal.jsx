import { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import { useLanguage } from '../../../shared/i18n';
import { TABLE_TEMPLATES, cleanCustomFields, tableName } from '../../../shared/tableTemplates';
import TemplatePicker from './TemplatePicker';
import CustomFieldsEditor from './CustomFieldsEditor';
import SubcategoryEditor from './SubcategoryEditor';

export default function NewTableModal({ onSave, onClose }) {
  const { t } = useLanguage();
  const tm = t.rankings.newTableModal;
  // vazio = nome automático, montado com os tipos marcados; digitou, vale o que digitou
  const [typedName,    setTypedName]    = useState('');
  const [templates,    setTemplates]    = useState(['movie']);
  const [customFields, setCustomFields] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [saving,       setSaving]       = useState(false);

  // "Séries", "Séries & Animes", "Filmes, Séries & Animes" (na ordem da grade)
  const typeNames = Object.keys(TABLE_TEMPLATES)
    // "Outro" não é nome de tabela: só "Outro" marcado deixa o nome vazio (vale o exemplo)
    .filter(template => template !== 'custom' && templates.includes(template))
    .map(template => tableName(t.rankings.types[TABLE_TEMPLATES[template].type]));
  const autoName = typeNames.length > 1
    ? `${typeNames.slice(0, -1).join(', ')} & ${typeNames[typeNames.length - 1]}`
    : typeNames[0] ?? '';
  const name = typedName.trim() ? typedName : autoName;

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      // o emoji do tipo continua no nome (o resto do site espera); a aba Rankings só não mostra
      await onSave({ name: `${TABLE_TEMPLATES[templates[0]].emoji} ${name.trim()}`, templates, customFields: cleanCustomFields(customFields),
        subcategories: subcategories.map(sub => sub.name.trim()).filter(Boolean) });
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || tm.createError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={tm.title}
      onClose={onClose}
      busy={saving}
      footer={(
        <>
          <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose} disabled={saving}>{tm.cancel}</button>
          <button type="button" className="mr-btn mr-btn-gold" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? tm.creating : tm.create}
          </button>
        </>
      )}
    >
      <div>
        <label className="mr-field-label" htmlFor="rk-new-table-name">{tm.name}</label>
        <input
          id="rk-new-table-name"
          className="mr-input"
          autoFocus
          value={name}
          placeholder={tm.namePlaceholder}
          maxLength={60}
          onChange={event => setTypedName(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') handleSave(); }}
          disabled={saving}
        />
      </div>

      <TemplatePicker value={templates} onChange={setTemplates} disabled={saving} />
      {templates.includes('custom') && (
        <CustomFieldsEditor value={customFields} onChange={setCustomFields} disabled={saving} />
      )}
      <SubcategoryEditor value={subcategories} onChange={setSubcategories} disabled={saving} />
    </Modal>
  );
}
