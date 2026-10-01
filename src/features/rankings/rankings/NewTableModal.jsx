import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../shared/i18n';
import { TABLE_TEMPLATES, needsCustomEmoji } from '../../../shared/tableTemplates';
import TemplatePicker from './TemplatePicker';

export default function NewTableModal({ onSave, onClose }) {
  const { t } = useLanguage();
  const tm = t.rankings.newTableModal;
  const [name,        setName]        = useState('');
  const [templates,   setTemplates]   = useState(['movie']);
  const [customEmoji, setCustomEmoji] = useState('');
  const [saving,      setSaving]      = useState(false);

  const isOutro = needsCustomEmoji(templates);
  const defaultEmoji = TABLE_TEMPLATES[templates[0]].emoji;
  const finalEmoji = isOutro ? (customEmoji.trim() || defaultEmoji) : defaultEmoji;
  const finalLabel = name.trim() ? `${finalEmoji} ${name.trim()}` : '';

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: finalLabel, templates });
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || tm.createError);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '7px 10px',
    borderRadius: 7, border: '1px solid var(--mr-border)',
    background: 'var(--mr-bg)', color: 'var(--mr-text)',
    fontSize: '0.875rem',
  };

  return createPortal(
    <div className="mr-modal-scrim" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--mr-surface)', border: '1px solid var(--mr-border)', borderRadius: 12, padding: '1.5rem', width: 340, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>{tm.title}</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 4 }}>{tm.name}</label>
          <input type="text" value={name} placeholder={tm.namePlaceholder} onChange={e => setName(e.target.value)} style={inputStyle} />
        </div>

        <TemplatePicker value={templates} onChange={setTemplates} disabled={saving} />

        {isOutro && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 4, textAlign: 'center' }}>
              {tm.tableEmoji}
            </label>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input
                type="text" value={customEmoji} placeholder={defaultEmoji}
                onChange={e => setCustomEmoji(e.target.value)} maxLength={4}
                style={{ ...inputStyle, width: 90, textAlign: 'center', fontSize: '1.1rem' }}
              />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4, textAlign: 'center' }}>
              {tm.emojiHint}
            </div>
          </div>
        )}

        {name.trim() && (
          <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 7, background: 'var(--mr-gold-subtle, rgba(201,162,39,0.08))', border: '1px solid rgba(201,162,39,0.25)', fontSize: '0.8rem', color: 'var(--mr-text-secondary)' }}>
            {tm.preview} <strong style={{ color: 'var(--mr-text)' }}>{finalLabel}</strong>
          </div>
        )}

        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose} disabled={saving}>{tm.cancel}</button>
          <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? tm.creating : tm.create}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
