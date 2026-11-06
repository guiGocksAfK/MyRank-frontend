import { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronRight, ImageOff, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { minutesToHHMM } from '../../../utils/formatters';
import { searchByType, getDetailsByType } from '../../../services/ExternalSearchService';
import { useLanguage } from '../../../shared/i18n';
import Modal from '../../../shared/components/Modal';
import SelectMenu from '../../../shared/components/SelectMenu';
import './itemModal.css';
import { TEMPLATE_ICONS, templateProvider, isTimeWeighted, hasSquareCover } from '../../../shared/tableTemplates';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3; // evita disparar busca com 1-2 caracteres
const NO_MSG = { text: '', tone: '' };

// Tabela mista: o tipo já vem escolhido (o último usado nela, senão o primeiro que
// busca), porque o seletor fica embaixo da busca. "Outro" nunca, ele desliga a busca.
const lastTypeKey = templates => `myrank_lastItemType:${[...templates].sort().join(',')}`;

function initialTemplate(item, templates) {
  if (item?.template) return item.template;
  if (templates.length === 1) return templates[0];
  try {
    const last = localStorage.getItem(lastTypeKey(templates));
    if (last && last !== 'custom' && templates.includes(last)) return last;
  } catch { /* sem localStorage, vale o primeiro */ }
  return templates.find(template => template !== 'custom') ?? templates[0];
}

export default function ItemModal({ item, templates = ['custom'], customFields = [], subcategories = [], defaultSubcategoryId = null, onSave, onClose }) {
  const { t } = useLanguage();
  const tm = t.rankings.itemModal;
  const ts = t.rankings.subcategories;
  const isEdit = !!item;

  const initialHHMM = minutesToHHMM(item?.timeMinutes);
  // Tabela de um tipo só: o item já nasce com ele. Tabela mista: a pessoa escolhe
  // entre os tipos da tabela. Personalizado não tem busca (preenchimento manual).
  const [itemTemplate, setItemTemplate] = useState(() => initialTemplate(item, templates));
  const workType = itemTemplate === 'custom' ? '' : itemTemplate;
  const isMixed = templates.length > 1;
  const [details, setDetails] = useState(item?.details ?? {});
  const [fieldValues, setFieldValues] = useState(item?.details?.fields ?? {});
  const [title, setTitle]   = useState(item?.title       ?? '');
  const [sub,   setSub]     = useState(item?.sub         ?? '');
  const [note,  setNote]    = useState(item?.note        ?? '');
  const [hours, setHours]   = useState(initialHHMM.hours ?? '');
  const [mins,  setMins]    = useState(initialHHMM.mins  ?? '');
  const [image, setImage]   = useState(item?.image       ?? '');
  const [releaseDate, setReleaseDate] = useState(item?.releaseDate ?? '');
  const [subcategoryId, setSubcategoryId] = useState(item ? item.subcategoryId ?? null : defaultSubcategoryId);
  // sem busca (Outro) a capa só entra pelo link, então ele já começa aberto
  const [coverOpen, setCoverOpen] = useState(itemTemplate === 'custom' && !item?.image);
  const [brokenCover, setBrokenCover] = useState(null);

  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState(NO_MSG);
  const [suggestions, setSuggestions] = useState([]); // resultados da busca, aguardando escolha
  const [saving, setSaving] = useState(false);
  const [attentionFields, setAttentionFields] = useState({});
  const [validationError, setValidationError] = useState('');

  // ── Busca automática (debounced) sempre que title ou workType mudam ──
  const requestIdRef = useRef(0); // evita que uma resposta antiga sobrescreva uma mais nova
  const skipNextSearchRef = useRef(false); // true logo após escolher uma sugestão, para não reabrir a lista
  // Editando, a obra já está escolhida: não busca o título que veio salvo, só depois
  // que a pessoa mexer nele. Compara o texto (e não um "pula uma vez") porque o
  // StrictMode roda o efeito duas vezes ao montar.
  const savedTitleRef = useRef(isEdit ? (item?.title ?? '').trim() : null);

  useEffect(() => {
    const thisRequestId = ++requestIdRef.current;
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const currentQuery = title.trim();
    if (savedTitleRef.current !== null) {
      if (currentQuery === savedTitleRef.current) return;
      savedTitleRef.current = null;
    }
    const canSearch = workType && currentQuery.length >= MIN_QUERY_LENGTH;
    let active = true;
    const timer = setTimeout(async () => {
      if (!canSearch) {
        setSuggestions([]);
        setSearchMsg(NO_MSG);
        setSearching(false);
        return;
      }
      setSearching(true);
      setSearchMsg(NO_MSG);
      try {
        const results = await searchByType(workType, currentQuery);
        if (!active || thisRequestId !== requestIdRef.current) return; // resposta obsoleta, ignora

        if (!results || results.length === 0) {
          setSuggestions([]);
          setSearchMsg({ text: workType === 'anime' ? tm.noneFoundAnime : tm.noneFound, tone: '' });
        } else {
          setSuggestions(results);
          setSearchMsg(NO_MSG);
        }
      } catch (err) {
        if (!active || thisRequestId !== requestIdRef.current) return;
        setSuggestions([]);
        setSearchMsg({
          text: workType === 'anime' ? tm.searchErrAnime : err.response?.data?.message || tm.searchErr,
          tone: 'error',
        });
      } finally {
        if (active && thisRequestId === requestIdRef.current) setSearching(false);
      }
    }, canSearch ? DEBOUNCE_MS : 0);

    return () => {
      clearTimeout(timer);
      active = false;
    };
  }, [title, workType, tm.noneFoundAnime, tm.noneFound, tm.searchErrAnime, tm.searchErr]);

  // "Atualizar dados": só o que muda com o tempo (episódios, situação, gêneros...).
  // Capa e data só se estiverem vazias; título, nota, tempo e criador nunca.
  const [refreshPicking, setRefreshPicking] = useState(false);

  function applyRefresh(fetched, externalId) {
    setDetails(current => ({
      ...current, ...fetched.details,
      externalId: String(externalId), provider: templateProvider(workType),
    }));
    if (!image && fetched.imageUrl) setImage(fetched.imageUrl);
    if (!releaseDate && fetched.releaseDate) setReleaseDate(fetched.releaseDate);
    setSearchMsg({ text: tm.refreshed, tone: 'ok' });
  }

  const detailsError = err => ({ text: err.response?.data?.message || tm.detailsErr, tone: 'error' });

  async function handleRefresh() {
    const thisRequestId = ++requestIdRef.current;
    setSearching(true);
    setSearchMsg({ text: tm.refreshing, tone: '' });
    try {
      if (details.externalId) {
        const fetched = await getDetailsByType(workType, details.externalId);
        if (thisRequestId !== requestIdRef.current) return;
        if (fetched) applyRefresh(fetched, details.externalId);
      } else {
        // Obra antiga, sem id da API: a pessoa confirma qual é, pra não ligar um remake.
        const results = await searchByType(workType, title.trim());
        if (thisRequestId !== requestIdRef.current) return;
        setSuggestions(results ?? []);
        setRefreshPicking(true);
        setSearchMsg({ text: results?.length ? tm.refreshPick : tm.noneFound, tone: '' });
      }
    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      setSearchMsg(detailsError(err));
    } finally {
      if (thisRequestId === requestIdRef.current) setSearching(false);
    }
  }

  async function handlePickSuggestion(suggestion) {
    if (refreshPicking) {
      const thisRequestId = ++requestIdRef.current;
      setSearching(true);
      setSearchMsg({ text: tm.loadingDetails, tone: '' });
      try {
        const fetched = await getDetailsByType(workType, suggestion.externalId);
        if (thisRequestId !== requestIdRef.current) return;
        if (fetched) applyRefresh(fetched, suggestion.externalId);
      } catch (err) {
        if (thisRequestId !== requestIdRef.current) return;
        setSearchMsg(detailsError(err));
      } finally {
        if (thisRequestId === requestIdRef.current) {
          setSuggestions([]);
          setRefreshPicking(false);
          setSearching(false);
        }
      }
      return;
    }
    const thisRequestId = ++requestIdRef.current;
    setSearching(true);
    setSearchMsg({ text: tm.loadingDetails, tone: '' });
    try {
      const fetchedDetails = await getDetailsByType(workType, suggestion.externalId);
      if (thisRequestId !== requestIdRef.current) return;
      if (fetchedDetails) {
        setDetails(current => {
          const next = { ...current, ...fetchedDetails.details, externalId: String(suggestion.externalId), provider: templateProvider(workType) };
          delete next.legacyClassificationRequired;
          return next;
        });
        skipNextSearchRef.current = Boolean(fetchedDetails.title && fetchedDetails.title !== title);
        setTitle(fetchedDetails.title || title);
        if (fetchedDetails.creator) setSub(fetchedDetails.creator);
        if (fetchedDetails.timeMinutes) {
          setHours(Math.floor(fetchedDetails.timeMinutes / 60) || '');
          setMins(fetchedDetails.timeMinutes % 60 || '');
        }
        if (fetchedDetails.imageUrl) setImage(fetchedDetails.imageUrl);
        if (fetchedDetails.releaseDate) setReleaseDate(fetchedDetails.releaseDate);
        setAttentionFields({
          creator: !fetchedDetails.creator,
          time: !fetchedDetails.timeMinutes,
          image: !fetchedDetails.imageUrl,
          releaseDate: !fetchedDetails.releaseDate,
          note: true,
        });
        if (!fetchedDetails.imageUrl) setCoverOpen(true);
        setSearchMsg({ text: tm.autofilled, tone: 'ok' });
      }
    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      setSearchMsg(detailsError(err));
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setSuggestions([]);
        setSearching(false);
      }
    }
  }

  function pickType(next) {
    if (next === itemTemplate) return;
    requestIdRef.current++;
    savedTitleRef.current = null; // trocou o tipo: aí sim busca no catálogo novo
    setItemTemplate(next);
    setDetails(current => {
      const cleaned = { ...current };
      delete cleaned.externalId;
      delete cleaned.provider;
      delete cleaned.legacyClassificationRequired;
      return cleaned;
    });
    setValidationError('');
    if (next === 'custom') setCoverOpen(true);
  }

  async function handleSave() {
    const n = parseFloat(note);
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(mins, 10) || 0;
    const total = h * 60 + m;

    const missingFields = [];
    if (!itemTemplate) missingFields.push(tm.workType.toLowerCase());
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

    // Campos próprios só existem em item Personalizado; trocar o tipo limpa (o backend exigiria).
    const baseDetails = { ...details };
    delete baseDetails.fields;
    const nextDetails = itemTemplate === 'custom' && customFields.length
      ? { ...baseDetails, fields: customFieldValues(customFields, fieldValues) }
      : baseDetails;

    const payload = {
      id: item?.id ?? null,
      template: itemTemplate,
      details: nextDetails,
      title: title.trim(),
      sub: sub.trim(),
      note: n,
      timeMinutes: total,
      releaseDate: releaseDate || null,
      image: image.trim(),
      subcategoryId,
    };

    setSaving(true);
    try {
      await onSave(payload);
      if (isMixed) {
        try { localStorage.setItem(lastTypeKey(templates), itemTemplate); } catch { /* só conveniência */ }
      }
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || tm.saveError);
    } finally {
      setSaving(false);
    }
  }

  const clearAttention = (field) => {
    if (!attentionFields[field]) return;
    setAttentionFields(current => ({ ...current, [field]: false }));
  };
  const attn = field => (attentionFields[field] ? ' is-attention' : '');

  const square = hasSquareCover(workType);
  const coverUrl = image.trim();
  const showCover = coverUrl && brokenCover !== coverUrl;
  const year = releaseDate ? releaseDate.slice(0, 4) : '';
  const placeholder = workType ? tm.searchPlaceholder : tm.manualPlaceholder;
  const typeLabel = value => t.rankings.itemTypes[value];

  const footer = (
    <>
      {validationError && (
        <p className="ik-error" role="alert">
          <AlertCircle size={15} strokeWidth={2} aria-hidden="true" />
          {validationError}
        </p>
      )}
      <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose} disabled={saving}>{tm.cancel}</button>
      <button type="button" className="mr-btn mr-btn-gold" onClick={handleSave} disabled={saving}>
        {saving ? tm.saving : tm.save}
      </button>
    </>
  );

  return (
    <Modal title={isEdit ? tm.editTitle : tm.addTitle} onClose={onClose} footer={footer} width={520} busy={saving} closeOnBackdrop={false}>
      <div>
        <label className="mr-field-label" htmlFor="ik-title">{tm.titleLabel}</label>
        <div className={`ik-search${workType ? ' has-icon' : ''}`}>
          {workType && <Search className="ik-search-icon" size={16} strokeWidth={1.8} aria-hidden="true" />}
          <input
            id="ik-title"
            className="mr-input"
            type="text"
            value={title}
            placeholder={placeholder}
            autoComplete="off"
            onChange={e => { requestIdRef.current++; setTitle(e.target.value); setValidationError(''); }}
          />
          {/* "Atualizar dados" quase nunca é usado: ícone discreto no canto do campo,
              que gira enquanto atualiza (e aí faz o papel do spinner) */}
          {isEdit && workType ? (
            <button type="button" className={`ik-refresh${searching ? ' is-busy' : ''}`} onClick={handleRefresh}
              disabled={searching || !title.trim()} aria-label={tm.refresh} title={tm.refresh}>
              <RefreshCw size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ) : searching && <Loader2 className="ik-spinner" size={16} strokeWidth={2} aria-label={tm.searching} />}
        </div>

        {suggestions.length > 0 && (
          <div className="ik-results">
            <div className="ik-results-head">
              <span>{fmt(tm.resultsCount, { n: suggestions.length })}</span>
              <button type="button" className="ik-icon-btn" onClick={() => { setSuggestions([]); setRefreshPicking(false); }}
                aria-label={tm.close} title={tm.close}>
                <X size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
            <ul>
              {suggestions.map(s => (
                <li key={s.externalId}>
                  <button type="button" className="ik-result" onClick={() => handlePickSuggestion(s)} disabled={searching}>
                    <span className={`ik-result-cover${square ? ' is-square' : ''}`}>
                      {s.posterUrl
                        ? <img src={s.posterUrl} alt="" loading="lazy" />
                        : <ImageOff size={16} strokeWidth={1.6} aria-hidden="true" />}
                    </span>
                    <span className="ik-result-text">
                      <strong>{s.title}</strong>
                      {(s.subtitle || s.releaseDate) && (
                        <span>
                          {s.releaseDate && <em>{s.releaseDate.slice(0, 4)}</em>}
                          {s.releaseDate && s.subtitle && ' · '}
                          {s.subtitle}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {searchMsg.text && (
          <p className={`mr-field-hint ik-msg${searchMsg.tone ? ` is-${searchMsg.tone}` : ''}`} role="status">{searchMsg.text}</p>
        )}
      </div>

      {/* a obra montada: capa, título, criador · ano e a nota em destaque */}
      <div className="ik-work">
        <button type="button" className={`ik-cover${square ? ' is-square' : ''}${attn('image')}`}
          onClick={() => setCoverOpen(true)} aria-label={tm.coverToggle} title={tm.coverToggle}>
          {showCover
            ? <img src={coverUrl} alt="" onError={() => setBrokenCover(coverUrl)} />
            : <ImageOff size={22} strokeWidth={1.4} aria-hidden="true" />}
        </button>
        <div className="ik-work-info">
          <strong className={title.trim() ? '' : 'is-empty'}>{title.trim() || tm.cardEmpty}</strong>
          {(sub.trim() || year) && <span>{[sub.trim(), year].filter(Boolean).join(' · ')}</span>}
          <label className="ik-score-wrap">
            <span className="mr-field-label">{tm.scoreLabel}</span>
            <span className={`ik-score${attn('note')}`}>
              <input type="number" inputMode="decimal" step="0.1" min="0" max="10" value={note} placeholder={tm.scorePlaceholder}
                onChange={e => { setNote(e.target.value); clearAttention('note'); setValidationError(''); }} />
              <span aria-hidden="true">/10</span>
            </span>
          </label>
        </div>
      </div>

      <div className="ik-grid">
        <label>
          <span className="mr-field-label">{tm.creatorLabel}</span>
          <input className={`mr-input${attn('creator')}`} type="text" value={sub} placeholder={tm.creatorPlaceholder}
            onChange={e => { setSub(e.target.value); clearAttention('creator'); }} />
        </label>
        <label>
          <span className="mr-field-label">{tm.releaseLabel}</span>
          <input className={`mr-input ik-date${attn('releaseDate')}`} type="date" value={releaseDate}
            onChange={e => { setReleaseDate(e.target.value); clearAttention('releaseDate'); }} />
        </label>
        {isTimeWeighted(itemTemplate) && (
          <div>
            <span className="mr-field-label" id="ik-time-label">{tm.timeLabel}</span>
            <div className={`mr-input ik-time${attn('time')}`} role="group" aria-labelledby="ik-time-label">
              <input type="number" inputMode="numeric" min="0" value={hours} placeholder="0" aria-label="h"
                onChange={e => { setHours(e.target.value); clearAttention('time'); }} />
              <span aria-hidden="true">h</span>
              <input type="number" inputMode="numeric" min="0" max="59" value={mins} placeholder="0" aria-label="min"
                onChange={e => { setMins(e.target.value); clearAttention('time'); }} />
              <span aria-hidden="true">min</span>
            </div>
          </div>
        )}
        {isMixed && (
          <div>
            <span className="mr-field-label" id="ik-type-label">{tm.workType}</span>
            {templates.length === 2 ? (
              <div className="ik-seg" role="radiogroup" aria-labelledby="ik-type-label">
                {templates.map(value => {
                  const Icon = TEMPLATE_ICONS[value];
                  return (
                    <button key={value} type="button" role="radio" aria-checked={value === itemTemplate}
                      className={value === itemTemplate ? 'is-active' : ''} onClick={() => pickType(value)}>
                      {Icon && <Icon size={14} strokeWidth={1.8} aria-hidden="true" />}
                      {typeLabel(value)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <SelectMenu label={tm.workType} value={itemTemplate} onChange={pickType}
                options={templates.map(value => ({ value, label: typeLabel(value) }))} />
            )}
          </div>
        )}
        {subcategories.length > 0 && (
          <div>
            <span className="mr-field-label">{ts.fieldLabel}</span>
            <SelectMenu
              label={ts.fieldLabel}
              value={subcategoryId}
              onChange={setSubcategoryId}
              options={[{ value: null, label: ts.fieldNone }, ...subcategories.map(s => ({ value: s.id, label: s.name }))]}
            />
          </div>
        )}
        {itemTemplate === 'custom' && customFields.map(field => (
          field.type === 'BOOLEAN' ? (
            <div key={field.id}>
              <span className="mr-field-label">{field.name}</span>
              <button type="button" role="switch" aria-checked={fieldValues[field.id] === true} aria-label={field.name}
                className="ik-switch" onClick={() => setFieldValues(v => ({ ...v, [field.id]: v[field.id] !== true }))}>
                <span aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label key={field.id}>
              <span className="mr-field-label">{field.name}</span>
              <input
                className={`mr-input${field.type === 'DATE' ? ' ik-date' : ''}`}
                type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                maxLength={field.type === 'TEXT' ? 200 : undefined}
                value={fieldValues[field.id] ?? ''}
                onChange={e => setFieldValues(v => ({ ...v, [field.id]: e.target.value }))}
              />
            </label>
          )
        ))}
      </div>

      <div>
        <button type="button" className="ik-link ik-disclosure" aria-expanded={coverOpen} onClick={() => setCoverOpen(v => !v)}>
          <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
          {tm.coverToggle}
        </button>
        {coverOpen && (
          <label className="ik-cover-field">
            <span className="mr-field-label">{tm.imageLabel}</span>
            <input className={`mr-input${attn('image')}`} type="url" value={image} placeholder="https://…"
              onChange={e => { setImage(e.target.value); clearAttention('image'); }} />
          </label>
        )}
      </div>
    </Modal>
  );
}

/** Converte o que foi digitado pro tipo que o backend valida; vazio vira "sem valor". */
function customFieldValues(customFields, raw) {
  const out = {};
  for (const field of customFields) {
    const value = raw[field.id];
    if (value === undefined || value === null || value === '') continue;
    if (field.type === 'NUMBER') {
      const n = Number(value);
      if (Number.isFinite(n)) out[field.id] = n;
    } else if (field.type === 'BOOLEAN') {
      out[field.id] = value === true;
    } else {
      out[field.id] = String(value);
    }
  }
  return out;
}
