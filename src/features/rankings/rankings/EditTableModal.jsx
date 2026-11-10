import { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import { useLanguage } from '../../../shared/i18n';
import { TABLE_TEMPLATES, needsCustomEmoji, cleanCustomFields } from '../../../shared/tableTemplates';
import TemplatePicker from './TemplatePicker';
import CustomFieldsEditor from './CustomFieldsEditor';
import SubcategoryEditor from './SubcategoryEditor';

export default function EditTableModal({ table, onSave, onAddSubcategory, onRenameSubcategory, onDeleteSubcategory, onDeleteTable, onClose }) {
  const { t } = useLanguage();
  const tm = t.rankings.editTableModal;
  const tr = t.rankings;
  const currentTemplates = table.templates ?? ['custom'];
  // Tipo que já tem item na tabela não pode sair (o backend também barra).
  const usedTemplates = [...new Set((table.items ?? []).map(item => item.template))];
  const labelParts = table.label.match(/^(\S+)\s+(.+)$/u);
  const hasEmoji = labelParts && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(labelParts[1]);
  const [name, setName] = useState(hasEmoji ? labelParts[2] : table.label);
  const [templates, setTemplates] = useState(currentTemplates);
  const [customFields, setCustomFields] = useState(table.customFields ?? []);
  const [subs, setSubs] = useState(() => (table.subcategories ?? []).map(sub => ({ key: `id-${sub.id}`, id: sub.id, name: sub.name, removed: false })));
  const subCounts = {};
  for (const item of table.items ?? []) {
    if (item.subcategoryId != null) subCounts[item.subcategoryId] = (subCounts[item.subcategoryId] ?? 0) + 1;
  }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // remove antes de criar, pra não esbarrar no limite de 20 à toa
  async function saveSubcategories() {
    const original = new Map((table.subcategories ?? []).map(sub => [sub.id, sub.name]));
    for (const sub of subs) if (sub.id && sub.removed) await onDeleteSubcategory(sub.id);
    for (const sub of subs) {
      const name = sub.name.trim();
      if (sub.id && !sub.removed && name && name !== original.get(sub.id)) await onRenameSubcategory(sub.id, name);
    }
    for (const sub of subs) {
      const name = sub.name.trim();
      if (!sub.id && name) await onAddSubcategory(name);
    }
  }

  async function handleSave() {
    const nextName = name.trim();
    if (!nextName) return;
    // emoji do tipo no nome; tabela "Outro" que já tinha um emoji escolhido mantém o dela
    const emoji = needsCustomEmoji(templates) && hasEmoji ? labelParts[1] : TABLE_TEMPLATES[templates[0]].emoji;
    const nextFields = cleanCustomFields(customFields);
    const removed = (table.customFields ?? []).filter(field => !nextFields.some(next => next.id === field.id));
    if (templates.includes('custom') && removed.length && !window.confirm(tm.removeFieldsConfirm)) return;
    setSaving(true);
    setError('');
    try {
      await onSave({ name: `${emoji} ${nextName}`, templates, customFields: nextFields });
      await saveSubcategories();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || tm.renameError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={tm.title}
      onClose={onClose}
      busy={saving}
      width={480}
      footer={(
        <>
          {/* ação perigosa fica aqui dentro, longe do "Adicionar obra"; a confirmação vem depois */}
          {onDeleteTable && (
            <button type="button" className="mr-btn mr-btn-danger-text" onClick={onDeleteTable} disabled={saving}>
              {tr.toolbar.deleteTable}
            </button>
          )}
          {error && <p className="ik-error" role="alert">{error}</p>}
          <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose} disabled={saving}>{tm.cancel}</button>
          <button type="button" className="mr-btn mr-btn-gold" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? tm.saving : tm.save}
          </button>
        </>
      )}
    >
      <div>
        <label className="mr-field-label" htmlFor="rk-edit-table-name">{tm.name}</label>
        <input
          id="rk-edit-table-name"
          className="mr-input"
          autoFocus
          value={name}
          maxLength={60}
          onChange={event => setName(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') handleSave(); }}
          disabled={saving}
        />
      </div>

      <TemplatePicker value={templates} onChange={setTemplates} locked={usedTemplates} disabled={saving} />
      {templates.includes('custom') && (
        <CustomFieldsEditor value={customFields} onChange={setCustomFields} disabled={saving} />
      )}

      <SubcategoryEditor value={subs} onChange={setSubs} counts={subCounts} disabled={saving} />
    </Modal>
  );
}
