import React, { useState } from 'react';

const TYPE_OPTIONS = [
  { value: 'filme', label: '🎬 Filmes', emoji: '🎬' },
  { value: 'jogo',  label: '🎮 Jogos',  emoji: '🎮' },
  { value: 'serie', label: '📺 Séries', emoji: '📺' },
  { value: 'livro', label: '📚 Livros', emoji: '📚' },
  { value: 'anime', label: '🎌 Animes', emoji: '🎌' },
  { value: 'outro', label: '📦 Outro',  emoji: '📦' },
];

export default function NewTableModal({ onSave, onClose }) {
  const [name,        setName]        = useState('');
  const [type,        setType]        = useState('filme');
  const [customEmoji, setCustomEmoji] = useState('📦');
  const [saving,      setSaving]      = useState(false);

  const isOutro = type === 'outro';
  const selectedType = TYPE_OPTIONS.find(o => o.value === type);
  const finalEmoji = isOutro ? (customEmoji.trim() || '📦') : (selectedType?.emoji ?? '');
  const finalLabel = name.trim() ? `${finalEmoji} ${name.trim()}` : '';

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(finalLabel);
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Erro ao criar a tabela.');
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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--mr-surface)', border: '1px solid var(--mr-border)', borderRadius: 12, padding: '1.5rem', width: 340, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📋 Nova tabela</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 4 }}>Nome</label>
          <input type="text" value={name} placeholder="Ex: Maratona Nolan" onChange={e => setName(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 4 }}>Tipo de mídia</label>
          <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {isOutro && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', display: 'block', marginBottom: 4, textAlign: 'center' }}>
              Emoji da tabela
            </label>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input
                type="text" value={customEmoji} placeholder="🎨 🎵 🎤 ⚽ 🍿..."
                onChange={e => setCustomEmoji(e.target.value)} maxLength={4}
                style={{ ...inputStyle, width: 90, textAlign: 'center', fontSize: '1.1rem' }}
              />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4, textAlign: 'center' }}>
              Escolha um emoji que represente sua tabela
            </div>
          </div>
        )}

        {name.trim() && (
          <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 7, background: 'var(--mr-gold-subtle, rgba(201,162,39,0.08))', border: '1px solid rgba(201,162,39,0.25)', fontSize: '0.8rem', color: 'var(--mr-text-secondary)' }}>
            Preview: <strong style={{ color: 'var(--mr-text)' }}>{finalLabel}</strong>
          </div>
        )}

        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}