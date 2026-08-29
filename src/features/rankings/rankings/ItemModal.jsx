import React, { useState, useEffect, useRef } from 'react';
import { formatTime, minutesToHHMM } from '../../../utils/formatters';
import { searchByType, getDetailsByType } from '../../../services/ExternalSearchService';
import { useLanguage } from '../../../shared/i18n';

const WORK_TYPE_VALUES = ['movie', 'tv', 'game', 'book', 'anime'];
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3; // evita disparar busca com 1-2 caracteres

export default function ItemModal({ item, onSave, onClose }) {
  const { t } = useLanguage();
  const tm = t.rankings.itemModal;
  const WORK_TYPES = WORK_TYPE_VALUES.map((value) => ({ value, label: t.rankings.itemTypes[value], enabled: true }));
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
  const [attentionFields, setAttentionFields] = useState({});
  const [validationError, setValidationError] = useState('');

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
      setSearchMsg(tm.searching);
      try {
        const results = await searchByType(workType, currentQuery);
        if (thisRequestId !== requestIdRef.current) return; // resposta obsoleta, ignora

        if (!results || results.length === 0) {
          setSuggestions([]);
          setSearchMsg(workType === 'anime' ? tm.noneFoundAnime : tm.noneFound);
        } else {
          setSuggestions(results);
          setSearchMsg('');
        }
      } catch (err) {
        if (thisRequestId !== requestIdRef.current) return;
        setSuggestions([]);
        setSearchMsg(`❌ ${workType === 'anime'
          ? tm.searchErrAnime
          : err.response?.data?.message || tm.searchErr}`);
      } finally {
        if (thisRequestId === requestIdRef.current) setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [title, workType]);

  async function handlePickSuggestion(suggestion) {
    setSearching(true);
    setSearchMsg(tm.loadingDetails);
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
        setAttentionFields({
          creator: !details.creator,
          time: !details.timeMinutes,
          image: !details.imageUrl,
          releaseDate: !details.releaseDate,
          note: true,
        });
        setSearchMsg(tm.autofilled);
      }
    } catch (err) {
      setSearchMsg(`❌ ${err.response?.data?.message || tm.detailsErr}`);
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

    const missingFields = [];
    if (!title.trim()) missingFields.push(tm.fieldTitle);
    if (Number.isNaN(n)) missingFields.push(tm.fieldScore);

    if (missingFields.length > 0) {
      setValidationError(fmt(tm.fillFields, { fields: missingFields.join(tm.fieldAnd) }));
      return;
    }

    if (n < 0 || n > 10) {
      setValidationError(tm.scoreRange);
      return;
    }

    setValidationError('');

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
      alert(err?.response?.data?.message || err.message || tm.saveError);
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

  const getFieldStyle = (field) => attentionFields[field]
    ? { ...inputStyle, borderColor: 'rgba(212,175,55,0.55)', boxShadow: '0 0 0 2px rgba(212,175,55,0.06), 0 0 9px rgba(212,175,55,0.08)' }
    : inputStyle;

  const clearAttention = (field) => {
    if (!attentionFields[field]) return;
    setAttentionFields(current => ({ ...current, [field]: false }));
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
          {isEdit ? tm.editTitle : tm.addTitle}
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{tm.workType}</label>
          <select
            value={workType}
            onChange={e => setWorkType(e.target.value)}
            style={inputStyle}
          >
            <option value="">{tm.select}</option>
            {WORK_TYPES.map(wt => (
              <option key={wt.value} value={wt.value} disabled={!wt.enabled}>{wt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{tm.titleLabel}</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text" value={title} placeholder={tm.titlePlaceholder}
              onChange={e => { setTitle(e.target.value); setValidationError(''); }}
              style={inputStyle}
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
              {tm.pickTypeFirst}
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
              {tm.tipOriginal}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{tm.creatorLabel}</label>
          <input type="text" value={sub} placeholder={tm.creatorPlaceholder} onChange={e => { setSub(e.target.value); clearAttention('creator'); }} style={getFieldStyle('creator')} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{tm.scoreLabel}</label>
          <input type="number" step="0.1" min="0" max="10" value={note} placeholder={tm.scorePlaceholder} onChange={e => { setNote(e.target.value); clearAttention('note'); setValidationError(''); }} style={getFieldStyle('note')} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{tm.timeLabel}</label>
          <div className="mr-flex mr-items-center mr-gap-2">
            <input type="number" min="0" value={hours} placeholder="0" onChange={e => { setHours(e.target.value); clearAttention('time'); }} style={{ ...getFieldStyle('time'), width: 80 }} />
            <span style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>h</span>
            <input type="number" min="0" max="59" value={mins} placeholder="0" onChange={e => { setMins(e.target.value); clearAttention('time'); }} style={{ ...getFieldStyle('time'), width: 80 }} />
            <span style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>min</span>
          </div>
          {(parseInt(hours, 10) > 0 || parseInt(mins, 10) > 0) && (
            <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>
              {tm.total} {formatTime((parseInt(hours, 10) || 0) * 60 + (parseInt(mins, 10) || 0))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{tm.releaseLabel}</label>
          <input type="date" value={releaseDate} onChange={e => { setReleaseDate(e.target.value); clearAttention('releaseDate'); }} style={getFieldStyle('releaseDate')} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{tm.imageLabel}</label>
          <div className="mr-flex mr-gap-2">
            <input type="text" value={image} placeholder="https://..." onChange={e => { setImage(e.target.value); clearAttention('image'); }} style={getFieldStyle('image')} />
            {image && (
              <div style={{ flexShrink: 0, width: 36, height: 54, borderRadius: 4, overflow: 'hidden' }}>
                <img src={image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>
            {tm.imageHint}
          </div>
        </div>

        {validationError && (
          <div style={{
            marginTop: 4, color: '#ff6b6b', fontSize: '0.75rem',
            lineHeight: 1.4,
          }} role="alert">
            {validationError}
          </div>
        )}

        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose} disabled={saving}>{tm.cancel}</button>
          <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? tm.saving : tm.save}
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
              {fmt(tm.resultsCount, { n: suggestions.length })}
            </span>
            <button
              onClick={() => setSuggestions([])}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--mr-text-secondary)', fontSize: '0.9rem', lineHeight: 1,
              }}
              title={tm.close}
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