import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import { useLanguage } from '../../../shared/i18n';
import { TABLE_TEMPLATES, needsCustomEmoji, cleanCustomFields } from '../../../shared/tableTemplates';
import TemplatePicker from './TemplatePicker';
import CustomFieldsEditor from './CustomFieldsEditor';
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/** Cria/renomeia/remove subcategorias na hora (independe do botão Salvar do nome). */
function SubcategoryManager({ subcategories, onAdd, onRename, onDelete }) {
  const { t } = useLanguage();
  const ts = t.rankings.subcategories;
  const [newName, setNewName] = useState('');
  const [drafts, setDrafts] = useState({}); // id → nome sendo editado
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const clearDraft = (id) => setDrafts(current => {
    const next = { ...current };
    delete next[id];
    return next;
  });

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      await action();
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || ts.error);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (await run(() => onAdd(name))) setNewName('');
  }

  async function handleRename(sub) {
    const name = (drafts[sub.id] ?? sub.name).trim();
    if (!name || name === sub.name) {
      clearDraft(sub.id);
      return;
    }
    if (await run(() => onRename(sub.id, name))) clearDraft(sub.id);
  }

  async function handleDelete(sub) {
    if (!window.confirm(fmt(ts.removeConfirm, { name: sub.name }))) return;
    await run(() => onDelete(sub.id));
  }

  return (
    <div className="rk-subs">
      <span className="mr-field-label">{ts.heading}</span>
      <p className="mr-field-hint rk-subs-hint">{ts.hint}</p>

      {subcategories.length > 0 && (
        <ul className="rk-subs-list">
          {subcategories.map(sub => (
            <li key={sub.id}>
              <input
                className="mr-input"
                aria-label={ts.rename}
                value={drafts[sub.id] ?? sub.name}
                onChange={event => setDrafts(current => ({ ...current, [sub.id]: event.target.value }))}
                onBlur={() => handleRename(sub)}
                onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                maxLength={60}
                disabled={busy}
              />
              <button type="button" className="rk-icon-btn is-danger" title={ts.remove} aria-label={`${ts.remove} ${sub.name}`}
                onClick={() => handleDelete(sub)} disabled={busy}>
                <X size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rk-subs-add">
        <input
          className="mr-input"
          value={newName}
          placeholder={ts.placeholder}
          onChange={event => setNewName(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') handleAdd(); }}
          maxLength={60}
          disabled={busy}
        />
        <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={handleAdd} disabled={busy || !newName.trim()}>
          <Plus size={14} strokeWidth={2} aria-hidden="true" />
          {ts.add}
        </button>
      </div>

      {error && <p className="rk-form-error" role="alert">{error}</p>}
    </div>
  );
}

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
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const nextName = name.trim();
    if (!nextName) return;
    // emoji do tipo no nome; tabela "Outro" que já tinha um emoji escolhido mantém o dela
    const emoji = needsCustomEmoji(templates) && hasEmoji ? labelParts[1] : TABLE_TEMPLATES[templates[0]].emoji;
    const nextFields = cleanCustomFields(customFields);
    const removed = (table.customFields ?? []).filter(field => !nextFields.some(next => next.id === field.id));
    if (templates.includes('custom') && removed.length && !window.confirm(tm.removeFieldsConfirm)) return;
    setSaving(true);
    try {
      await onSave({ name: `${emoji} ${nextName}`, templates, customFields: nextFields });
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || tm.renameError);
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

      <SubcategoryManager
        subcategories={table.subcategories}
        onAdd={onAddSubcategory}
        onRename={onRenameSubcategory}
        onDelete={onDeleteSubcategory}
      />
    </Modal>
  );
}
