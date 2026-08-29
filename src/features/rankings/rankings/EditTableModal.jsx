import { useState } from 'react';
import { useLanguage } from '../../../shared/i18n';

const TYPE_EMOJI = { filme: '🎬', jogo: '🎮', serie: '📺', livro: '📚', anime: '🎌', outro: '📦' };

export default function EditTableModal({ table, onSave, onClose }) {
  const { t } = useLanguage();
  const tm = t.rankings.editTableModal;
  const TYPE_OPTIONS = Object.keys(TYPE_EMOJI).map((value) => ({
    value, emoji: TYPE_EMOJI[value], label: t.rankings.types[value],
  }));
  const labelParts = table.label.split(' ');
  const currentEmoji = labelParts.shift() || '📦';
  const currentType = TYPE_OPTIONS.find(option => option.emoji === currentEmoji)?.value || 'outro';
  const [name, setName] = useState(labelParts.join(' '));
  const [type, setType] = useState(currentType);
  const [customEmoji, setCustomEmoji] = useState(currentType === 'outro' ? currentEmoji : '📦');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const nextName = name.trim();
    if (!nextName) return;
    const selectedType = TYPE_OPTIONS.find(option => option.value === type);
    const emoji = type === 'outro' ? (customEmoji.trim() || '📦') : selectedType.emoji;
    setSaving(true);
    try {
      await onSave(`${emoji} ${nextName}`);
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
        style={{ width: 360, maxWidth: '100%', padding: '1.5rem', background: 'var(--mr-surface)', border: '1px solid var(--mr-border)', borderRadius: 12, boxShadow: '0 18px 50px rgba(0,0,0,0.5)' }}
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
        {type === 'outro' && (
          <>
            <label htmlFor="mr-edit-table-emoji" style={{ display: 'block', margin: '1rem 0 5px', color: 'var(--mr-text-secondary)', fontSize: '0.75rem' }}>
              {tm.tableEmoji}
            </label>
            <input id="mr-edit-table-emoji" value={customEmoji} onChange={event => setCustomEmoji(event.target.value)} maxLength={4} style={{ ...inputStyle, width: 90, textAlign: 'center', fontSize: '1.1rem' }} disabled={saving} />
          </>
        )}
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