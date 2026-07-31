import React, { useState } from 'react';
import { formatTime, minutesToHHMM } from '../../utils/formatters';
import { fetchMetadataSuggestion } from '../../data/mockData';

export default function ItemModal({ item, onSave, onClose }) {
  const isEdit = !!item;

  const initialHHMM = minutesToHHMM(item?.timeMinutes);
  const [title, setTitle]   = useState(item?.title       ?? '');
  const [sub,   setSub]     = useState(item?.sub         ?? '');
  const [note,  setNote]    = useState(item?.note        ?? '');
  const [hours, setHours]   = useState(initialHHMM.hours ?? '');
  const [mins,  setMins]    = useState(initialHHMM.mins  ?? '');
  const [image, setImage]   = useState(item?.image       ?? '');
  const [releaseDate, setReleaseDate] = useState(item?.releaseDate ?? '');

  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAutoFill() {
    if (!title.trim()) {
      setSearchMsg('⚠️ Digite um título primeiro');
      return;
    }
    setSearching(true);
    setSearchMsg('🔎 Buscando metadados...');
    try {
      const data = await fetchMetadataSuggestion(title.trim());
      if (!data) {
        setSearchMsg('❌ Nenhuma obra encontrada com esse título');
        return;
      }
      if (data.director || data.studio || data.author) setSub(data.director || data.studio || data.author);
      if (data.timeMinutes) {
        setHours(Math.floor(data.timeMinutes / 60) || '');
        setMins(data.timeMinutes % 60 || '');
      }
      if (data.image) setImage(data.image);
      if (data.releaseDate) setReleaseDate(data.releaseDate);
      setSearchMsg('✓ Metadados preenchidos automaticamente!');
    } catch {
      setSearchMsg('❌ Erro ao buscar metadados');
    } finally {
      setSearching(false);
    }
  }

  async function handleSave() {
    const n = parseFloat(note);
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(mins, 10) || 0;
    const t = h * 60 + m;

    if (!title.trim() || isNaN(n) || n < 0 || n > 10 || t <= 0) {
      alert('Preencha título, uma nota entre 0 e 10, e um tempo maior que zero.');
      return;
    }

    const payload = {
      id: item?.id ?? null,
      title: title.trim(),
      sub: sub.trim(),
      note: n,
      timeMinutes: t,
      releaseDate: releaseDate || null,
      image: image.trim(),
    };

    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Erro ao salvar a obra.');
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

  const labelStyle = {
    fontSize: '0.75rem', color: 'var(--mr-text-secondary)',
    display: 'block', marginBottom: 4,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
          borderRadius: 12, padding: '1.5rem', width: 400, maxWidth: '90vw',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>
          {isEdit ? '✏️ Editar obra' : '➕ Adicionar obra'}
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Título</label>
          <div className="mr-flex mr-gap-2">
            <input
              type="text" value={title} placeholder="Ex: Interstellar"
              onChange={e => setTitle(e.target.value)}
              style={inputStyle}
            />
            <button
              className="mr-btn mr-btn-outline mr-btn-sm"
              onClick={handleAutoFill}
              disabled={searching}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {searching ? '⏳ Buscando...' : '🔍 Auto-preencher'}
            </button>
          </div>
          {searchMsg && (
            <div style={{
              fontSize: '0.7rem', marginTop: 4,
              color: searchMsg.startsWith('✓') ? 'var(--mr-gold)' : 'var(--mr-text-secondary)',
            }}>
              {searchMsg}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Autor / Diretor / Estúdio</label>
          <input type="text" value={sub} placeholder="Ex: Christopher Nolan" onChange={e => setSub(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nota (0,0 – 10,0)</label>
          <input type="number" step="0.1" min="0" max="10" value={note} placeholder="Ex: 9.2" onChange={e => setNote(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Tempo de consumo</label>
          <div className="mr-flex mr-items-center mr-gap-2">
            <input type="number" min="0" value={hours} placeholder="0" onChange={e => setHours(e.target.value)} style={{ ...inputStyle, width: 80 }} />
            <span style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>h</span>
            <input type="number" min="0" max="59" value={mins} placeholder="0" onChange={e => setMins(e.target.value)} style={{ ...inputStyle, width: 80 }} />
            <span style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>min</span>
          </div>
          {(parseInt(hours, 10) > 0 || parseInt(mins, 10) > 0) && (
            <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>
              Total: {formatTime((parseInt(hours, 10) || 0) * 60 + (parseInt(mins, 10) || 0))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Data de lançamento</label>
          <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>URL da imagem</label>
          <div className="mr-flex mr-gap-2">
            <input type="text" value={image} placeholder="https://..." onChange={e => setImage(e.target.value)} style={inputStyle} />
            {image && (
              <div style={{ flexShrink: 0, width: 36, height: 54, borderRadius: 4, overflow: 'hidden' }}>
                <img src={image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>
            Deixe vazio para usar placeholder automático
          </div>
        </div>

        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}