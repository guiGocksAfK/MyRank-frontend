import { useState } from 'react';
import { useLanguage } from '../../../shared/i18n';
import { TABLE_TEMPLATES } from '../../../shared/tableTemplates';
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/** Cria/renomeia/remove subcategorias na hora (independe do botão Salvar do nome). */
function SubcategoryManager({ subcategories, onAdd, onRename, onDelete, inputStyle }) {
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
    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--mr-border)' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ts.heading}</div>
      <p style={{ margin: '4px 0 10px', fontSize: '0.72rem', color: 'var(--mr-text-secondary)', lineHeight: 1.45 }}>
        {ts.hint}
      </p>

      {subcategories.length === 0 && (
        <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--mr-text-muted)' }}>{ts.empty}</p>
      )}

      <div className="mr-space-y-2" style={{ marginBottom: 10 }}>
        {subcategories.map(sub => (
          <div key={sub.id} className="mr-flex mr-items-center mr-gap-2">
            <input
              aria-label={ts.rename}
              value={drafts[sub.id] ?? sub.name}
              onChange={event => setDrafts(current => ({ ...current, [sub.id]: event.target.value }))}
              onBlur={() => handleRename(sub)}
              onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
              maxLength={60}
              style={inputStyle}
              disabled={busy}
            />
            <button
              type="button"
              className="mr-btn mr-btn-ghost mr-btn-sm"
              title={ts.remove}
              aria-label={`${ts.remove} ${sub.name}`}
              onClick={() => handleDelete(sub)}
              disabled={busy}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mr-flex mr-items-center mr-gap-2">
        <input
          value={newName}
          placeholder={ts.placeholder}
          onChange={event => setNewName(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') handleAdd(); }}
          maxLength={60}
          style={inputStyle}
          disabled={busy}
        />
        <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={handleAdd} disabled={busy || !newName.trim()}>
          {ts.add}
        </button>
      </div>

      {error && <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#ff6b6b' }} role="alert">{error}</p>}
    </div>
  );
}

export default function EditTableModal({ table, onSave, onAddSubcategory, onRenameSubcategory, onDeleteSubcategory, onClose }) {
  const { t } = useLanguage();
  const tm = t.rankings.editTableModal;
  const TYPE_OPTIONS = Object.entries(TABLE_TEMPLATES).map(([value, meta]) => ({
    value, emoji: meta.emoji, label: t.rankings.types[meta.type],
  }));
  const currentType = table.template ?? 'custom';
  const labelParts = table.label.match(/^(\S+)\s+(.+)$/u);
  const hasEmoji = labelParts && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(labelParts[1]);
  const currentEmoji = hasEmoji ? labelParts[1] : TABLE_TEMPLATES[currentType].emoji;
  const [name, setName] = useState(hasEmoji ? labelParts[2] : table.label);
  const [type, setType] = useState(currentType);
  const [customEmoji, setCustomEmoji] = useState(currentType === 'custom' ? currentEmoji : '📦');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const nextName = name.trim();
    if (!nextName) return;
    const selectedType = TYPE_OPTIONS.find(option => option.value === type);
    const emoji = type === 'custom' ? (customEmoji.trim() || '📦') : selectedType.emoji;
    setSaving(true);
    try {
      await onSave({ name: `${emoji} ${nextName}`, template: type });
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || tm.renameError);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 7,
    border: '1px solid var(--mr-border)', background: 'var(--mr-bg)',
    color: 'var(--mr-text)', fontSize: '0.875rem',
  };

  return (
    <div
      role="presentation"
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mr-edit-table-title"
        style={{ width: 400, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', background: 'var(--mr-surface)', border: '1px solid var(--mr-border)', borderRadius: 12, boxShadow: '0 18px 50px rgba(0,0,0,0.5)' }}
        onClick={event => event.stopPropagation()}
      >
        <h2 id="mr-edit-table-title" style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
          {tm.title}
        </h2>
        <label htmlFor="mr-edit-table-name" style={{ display: 'block', marginBottom: 5, color: 'var(--mr-text-secondary)', fontSize: '0.75rem' }}>
          {tm.name}
        </label>
        <input
          id="mr-edit-table-name"
          autoFocus
          value={name}
          onChange={event => setName(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') handleSave(); }}
          style={inputStyle}
          disabled={saving}
        />
        <label htmlFor="mr-edit-table-type" style={{ display: 'block', margin: '1rem 0 5px', color: 'var(--mr-text-secondary)', fontSize: '0.75rem' }}>
          {tm.mediaType}
        </label>
        <select id="mr-edit-table-type" value={type} onChange={event => setType(event.target.value)} style={inputStyle} disabled={saving}>
          {TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {type === 'custom' && (
          <>
            <label htmlFor="mr-edit-table-emoji" style={{ display: 'block', margin: '1rem 0 5px', color: 'var(--mr-text-secondary)', fontSize: '0.75rem' }}>
              {tm.tableEmoji}
            </label>
            <input id="mr-edit-table-emoji" value={customEmoji} onChange={event => setCustomEmoji(event.target.value)} maxLength={4} style={{ ...inputStyle, width: 90, textAlign: 'center', fontSize: '1.1rem' }} disabled={saving} />
          </>
        )}
        <SubcategoryManager
          subcategories={table.subcategories}
          onAdd={onAddSubcategory}
          onRename={onRenameSubcategory}
          onDelete={onDeleteSubcategory}
          inputStyle={inputStyle}
        />
        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose} disabled={saving}>{tm.cancel}</button>
          <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? tm.saving : tm.save}
          </button>
        </div>
      </div>
    </div>
  );
}
