import React, { useState, useEffect, useRef } from 'react';
import { formatTime, minutesToHHMM } from '../../utils/formatters';
import { searchByType, getDetailsByType } from '../../services/ExternalSearchService';

const WORK_TYPES = [
  { value: 'movie', label: '🎬 Filme', enabled: true },
  { value: 'tv',    label: '📺 Série', enabled: true },
  { value: 'game',  label: '🎮 Jogo', enabled: true },
  { value: 'book',  label: '📚 Livro (em breve)', enabled: false },
  { value: 'anime', label: '⛩️ Anime (em breve)', enabled: false },
];

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3; // evita disparar busca com 1-2 caracteres

export default function ItemModal({ item, onSave, onClose }) {
  const isEdit = !!item;

  const initialHHMM = minutesToHHMM(item?.timeMinutes);
  const [workType, setWorkType] = useState(item?.workType ?? '');
  const [title, setTitle]   = useState(item?.title       ?? '');
  const [sub,   setSub]     = useState(item?.sub         ?? '');
  const [note,  setNote]    = useState(item?.note        ?? '');
  const [hours, setHours]   = useState(initialHHMM.hours ?? '');
  const [mins,  setMins]    = useState(initialHHMM.mins  ?? '');
  const [image, setImage]   = useState(item?.image       ?? '');
  const [releaseDate, setReleaseDate] = useState(item?.releaseDate ?? '');

  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');
  const [suggestions, setSuggestions] = useState([]); // resultados da busca, aguardando escolha
  const [saving, setSaving] = useState(false);

  // ── Busca automática (debounced) sempre que title ou workType mudam ──
  const requestIdRef = useRef(0); // evita que uma resposta antiga sobrescreva uma mais nova
  const skipNextSearchRef = useRef(false); // true logo após escolher uma sugestão, para não reabrir o painel

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (!workType || title.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setSearchMsg('');
      return;
    }

    const currentQuery = title.trim();
    const timer = setTimeout(async () => {
      const thisRequestId = ++requestIdRef.current;
      setSearching(true);
      setSearchMsg('🔎 Buscando...');
      try {
        const results = await searchByType(workType, currentQuery);
        if (thisRequestId !== requestIdRef.current) return; // resposta obsoleta, ignora

        if (!results || results.length === 0) {
          setSuggestions([]);
          setSearchMsg('❌ Nada encontrado. Tente o título original (em inglês).');
        } else {
          setSuggestions(results);
          setSearchMsg('');
        }
      } catch {
        if (thisRequestId !== requestIdRef.current) return;
        setSuggestions([]);
        setSearchMsg('❌ Erro ao buscar. Tente novamente.');
      } finally {
        if (thisRequestId === requestIdRef.current) setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [title, workType]);

  async function handlePickSuggestion(suggestion) {
    setSearching(true);
    setSearchMsg('🔎 Carregando detalhes...');
    try {
      const details = await getDetailsByType(workType, suggestion.externalId);
      if (details) {
        skipNextSearchRef.current = true;
        setTitle(details.title || title);
        if (details.creator) setSub(details.creator);
        if (details.timeMinutes) {
          setHours(Math.floor(details.timeMinutes / 60) || '');
          setMins(details.timeMinutes % 60 || '');
        }
        if (details.imageUrl) setImage(details.imageUrl);
        if (details.releaseDate) setReleaseDate(details.releaseDate);
        setSearchMsg('✓ Preenchido automaticamente!');
      }
    } catch {
      setSearchMsg('❌ Erro ao buscar detalhes dessa obra.');
    } finally {
      setSuggestions([]);
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

  const showSidePanel = suggestions.length > 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 16,
      }}
      onClick={onClose}
    >
      {/* Modal principal */}
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
          <label style={labelStyle}>Tipo de obra</label>
          <select
            value={workType}
            onChange={e => setWorkType(e.target.value)}
            style={inputStyle}
          >
            <option value="">Selecione...</option>
            {WORK_TYPES.map(t => (
              <option key={t.value} value={t.value} disabled={!t.enabled}>{t.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Título</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text" value={title} placeholder="Ex: Interstellar"
              onChange={e => setTitle(e.target.value)}
              style={inputStyle}
              disabled={!workType}
            />
            {searching && (
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: '0.8rem',
              }}>⏳</span>
            )}
          </div>
          {!workType && (
            <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>
              Escolha o tipo de obra acima para habilitar a busca.
            </div>
          )}
          {searchMsg && (
            <div style={{
              fontSize: '0.7rem', marginTop: 4,
              color: searchMsg.startsWith('✓') ? 'var(--mr-gold)' : 'var(--mr-text-secondary)',
            }}>
              {searchMsg}
            </div>
          )}
          {!searchMsg && !showSidePanel && (
            <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>
              Dica: se não encontrar, tente o título original (em inglês).
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

      {/* Painel lateral de sugestões (flyout) */}
      {showSidePanel && (
        <div
          style={{
            background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
            borderRadius: 12, width: 300, maxWidth: '85vw', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--mr-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
              Resultados ({suggestions.length})
            </span>
            <button
              onClick={() => setSuggestions([])}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--mr-text-secondary)', fontSize: '0.9rem', lineHeight: 1,
              }}
              title="Fechar"
            >✕</button>
          </div>

          <div style={{ overflowY: 'auto', padding: 8 }}>
            {suggestions.map(s => (
              <div
                key={s.externalId}
                onClick={() => handlePickSuggestion(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px', cursor: 'pointer',
                  borderRadius: 8,
                  transition: 'background 0.15s',
                  marginBottom: 4,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 46, height: 68, borderRadius: 6, overflow: 'hidden',
                  flexShrink: 0, background: 'var(--mr-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--mr-border)',
                }}>
                  {s.posterUrl ? (
                    <img src={s.posterUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.2rem' }}>🎞️</span>
                  )}
                </div>
                <div className="mr-min-w-0">
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3 }}>{s.title}</div>
                  {s.releaseDate && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--mr-gold)', marginTop: 2 }}>
                      {s.releaseDate.slice(0, 4)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}