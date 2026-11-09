import { useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import { typeIconFor } from './socialData';

const MAX_SHOWN = 8;
// busca sem acento e sem maiúscula: "senhor dos aneis" acha "O Senhor dos Anéis"
const fold = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Escolher a obra do take: uma busca em vez de uma lista enorme. Vazia, mostra
 * as que você avaliou por último; digitando, filtra pelo título. Escolhida, a
 * obra vira um cartão com capa e nota, com um X pra trocar.
 */
export default function WorkPicker({ works, value, onChange }) {
  const { t, locale } = useLanguage();
  const tc = t.social.composer;
  const listId = useId();
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const term = fold(q.trim());
  const shown = useMemo(() => {
    if (!term) {
      return [...works]
        .sort((a, b) => String(b.addedDate || '').localeCompare(String(a.addedDate || '')))
        .slice(0, MAX_SHOWN);
    }
    // começa com o termo vem antes de só conter
    return works
      .map((w) => ({ w, i: fold(w.title).indexOf(term) }))
      .filter((x) => x.i >= 0)
      .sort((a, b) => (a.i === 0 ? 0 : 1) - (b.i === 0 ? 0 : 1) || a.w.title.localeCompare(b.w.title))
      .slice(0, MAX_SHOWN)
      .map((x) => x.w);
  }, [works, term]);

  const note = (n) => (Number.isFinite(Number(n)) && n !== null && n !== ''
    ? Number(n).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : null);

  const pick = (w) => {
    onChange(w);
    setQ('');
    setOpen(false);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, shown.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && open && shown[active]) { e.preventDefault(); pick(shown[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const cover = (w, size) => (
    <span className="social-pick-cover">
      {w.image
        ? <img src={w.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        : typeIconFor(w.type, size)}
    </span>
  );

  if (value) {
    return (
      <div className="social-pick-chosen">
        {cover(value, 14)}
        <span className="social-pick-text">
          <span className="social-pick-title">{value.title}</span>
          <span className="social-pick-type">{t.common.mediaTypes[value.type] || value.type}</span>
        </span>
        {note(value.note) && <span className="social-pick-score">{note(value.note)}</span>}
        <button
          type="button"
          className="social-icon-btn"
          aria-label={tc.changeWork}
          title={tc.changeWork}
          onClick={() => { onChange(null); requestAnimationFrame(() => inputRef.current?.focus()); }}
        >
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="social-pick">
      <label className="social-search social-pick-field">
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={tc.searchWork}
          placeholder={tc.searchWork}
          value={q}
          autoFocus
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={onKey}
        />
      </label>
      {open && (
        <ul className="social-pick-list" id={listId} role="listbox">
          {!term && shown.length > 0 && <li className="social-pick-head" role="presentation">{tc.recentWorks}</li>}
          {shown.length === 0 && <li className="social-pick-empty" role="presentation">{tc.noMatch}</li>}
          {shown.map((w, i) => (
            <li
              key={w.id}
              role="option"
              aria-selected={i === active}
              className={`social-pick-option${i === active ? ' is-active' : ''}`}
              // mousedown: escolhe antes do blur do campo fechar a lista
              onMouseDown={(e) => { e.preventDefault(); pick(w); }}
              onMouseEnter={() => setActive(i)}
            >
              {cover(w, 12)}
              <span className="social-pick-text">
                <span className="social-pick-title">{w.title}</span>
                <span className="social-pick-type">{t.common.mediaTypes[w.type] || w.type}</span>
              </span>
              {note(w.note) && <span className="social-pick-score">{note(w.note)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
