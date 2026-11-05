import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { TABLE_TEMPLATES, tableName } from '../../../shared/tableTemplates';
import { genreLabel } from '../../../shared/genres';
import { creatorKey, splitCreators } from '../../../shared/creatorNames';
import { activeFilterCount, getYear, itemGenres, statusGroup } from '../../../utils/formatters';
import useDismiss from '../../../shared/components/useDismiss';

const DECADES = [1980, 1990, 2000, 2010, 2020];
const TYPE_ORDER = [...new Set(Object.values(TABLE_TEMPLATES).map(template => template.type))];
const DAY = 24 * 60 * 60 * 1000;

/** "Ação, Drama" ou "Ação +2" quando não cabe. */
const summary = (labels) => (labels.length > 2 ? `${labels[0]} +${labels.length - 1}` : labels.join(', '));
const isoDay = (time) => new Date(time).toISOString().slice(0, 10);

/**
 * Um filtro da barra: botão que abre um menu. Ligado, fica dourado com o valor
 * ("Nota: 7–10") e ganha um × que desliga só ele.
 */
function FilterMenu({ label, value, onClear, clearLabel, wide, children }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const button = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, box, button);
  const active = value != null;
  // perto da borda direita o menu abre pra esquerda, senão sai da tela
  const list = useRef(null);
  const [alignRight, setAlignRight] = useState(false);
  useLayoutEffect(() => {
    if (!open || !list.current || !box.current) return;
    const width = list.current.offsetWidth;
    setAlignRight(box.current.getBoundingClientRect().left + width > window.innerWidth - 8);
  }, [open]);

  return (
    <div className={`rk-fmenu${active ? ' is-active' : ''}`} ref={box}>
      <button ref={button} type="button" className="rk-fmenu-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(v => !v)}>
        {active ? `${label}: ${value}` : label}
        {!active && <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />}
      </button>
      {active && onClear && (
        <button type="button" className="rk-fmenu-clear" aria-label={`${clearLabel}: ${label}`} onClick={onClear}>
          <X size={13} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
      {open && (
        <div ref={list} className={`mr-menu rk-fmenu-list${wide ? ' is-wide' : ''}${alignRight ? ' is-right' : ''}`} role="dialog" aria-label={label}>
          <div className="mr-menu-label rk-fmenu-title" aria-hidden="true">{label}</div>
          {children}
        </div>
      )}
    </div>
  );
}

function Option({ checked, onClick, children, disabled }) {
  return (
    <button type="button" role="menuitemcheckbox" aria-checked={checked} aria-disabled={disabled} className="mr-menu-item" onClick={onClick}>
      <span className="mr-menu-radio" aria-hidden="true" />
      {children}
    </button>
  );
}

/** Campo numérico sem setinhas: aceita vírgula e só aplica ao sair do campo (ou Enter). */
function NumberField({ label, value, placeholder, format, onCommit, suffix }) {
  const [draft, setDraft] = useState(null);
  const commit = () => {
    if (draft == null) return;
    const text = draft.trim();
    const parsed = text === '' ? null : Number(text.replace(',', '.'));
    if (parsed === null || Number.isFinite(parsed)) onCommit(parsed);
    setDraft(null);
  };
  return (
    <label>
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={draft ?? (value == null ? '' : format(value))}
        placeholder={placeholder}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
      />
      {suffix}
    </label>
  );
}

const HISTO_BARS = 30;

/**
 * Faixa "de / até": histograma das obras, trilho com duas bolinhas, limites,
 * campos e atalhos. Valor vazio (null) = sem limite daquele lado; encostar a
 * bolinha na ponta também solta o limite.
 */
function RangeControl({ min, max, step, low, high, onChange, values = [], presets = [], format = String, labels, worksLabel, suffix }) {
  const lo = low ?? min;
  const hi = high ?? max;
  const span = Math.max(max - min, step);
  const pct = (v) => ((v - min) / span) * 100;
  const clamp = (v) => Math.min(max, Math.max(min, v));

  // corrige ao confirmar: fora do limite vai pro limite; "de" maior que "até" troca os dois
  function commit(side, value) {
    let nextLo = side === 'low' ? value : low;
    let nextHi = side === 'high' ? value : high;
    if (nextLo != null) nextLo = clamp(nextLo);
    if (nextHi != null) nextHi = clamp(nextHi);
    if (nextLo != null && nextHi != null && nextLo > nextHi) [nextLo, nextHi] = [nextHi, nextLo];
    onChange(nextLo != null && nextLo <= min ? null : nextLo, nextHi != null && nextHi >= max ? null : nextHi);
  }

  // cada coluna é um valor exato (um ano, meio ponto de nota), alinhado com o trilho
  const bars = useMemo(() => {
    const width = step < 1 ? 0.5 : Math.max(step, Math.ceil(span / (HISTO_BARS - 1)));
    const count = Math.floor(span / width) + 1;
    const bins = Array(count).fill(0);
    values.forEach(v => {
      if (v == null || v < min || v > max) return;
      bins[Math.min(count - 1, Math.floor((v - min) / width + 1e-9))] += 1;
    });
    const peak = Math.max(1, ...bins);
    // cada coluna cobre [at, at + width): na nota, 9,5 a 9,9 e depois o 10
    return bins.map((n, i) => ({ n, at: min + i * width, end: Math.min(max, min + (i + 1) * width - step), height: 15 + (n / peak) * 85 }));
  }, [values, min, max, span, step]);

  return (
    <div className="rk-range">
      <div className="rk-range-graph">
        <div className="rk-histo" style={{ '--gaps': Math.max(1, bars.length - 1) }}>
          {bars.map((bar, i) => (
            <span
              key={i}
              className={`${bar.n ? '' : 'is-empty'}${bar.end >= lo && bar.at <= hi ? ' is-in' : ''}`}
              style={{ height: bar.n ? `${bar.height}%` : undefined }}
              title={bar.n ? `${bar.end > bar.at ? `${format(bar.at)}–${format(bar.end)}` : format(bar.at)}${suffix ?? ''} · ${worksLabel(bar.n)}` : undefined}
            />
          ))}
        </div>
        <div className="rk-range-slider" style={{ '--a': pct(lo) / 100, '--b': pct(hi) / 100 }}>
          <input type="range" aria-label={labels.from} min={min} max={max} step={step} value={lo}
            onChange={event => { const v = Math.min(Number(event.target.value), hi); onChange(v <= min ? null : v, high); }} />
          <input type="range" aria-label={labels.to} min={min} max={max} step={step} value={hi}
            onChange={event => { const v = Math.max(Number(event.target.value), lo); onChange(low, v >= max ? null : v); }} />
        </div>
        <div className="rk-range-limits" aria-hidden="true">
          <span>{format(min)}{suffix}</span>
          <span>{format(max)}{suffix}</span>
        </div>
      </div>

      <div className="rk-range-fields">
        <NumberField label={labels.from} value={low} placeholder={format(min)} format={format} suffix={suffix}
          onCommit={v => commit('low', v)} />
        <NumberField label={labels.to} value={high} placeholder={format(max)} format={format} suffix={suffix}
          onCommit={v => commit('high', v)} />
      </div>

      {(presets.length > 0 || low != null || high != null) && (
        <div className="rk-presets">
          {presets.map(preset => {
            const active = (preset.low ?? null) === (low ?? null) && (preset.high ?? null) === (high ?? null);
            return (
              <button key={preset.label} type="button" className={active ? 'is-active' : ''} aria-pressed={active}
                onClick={() => onChange(preset.low ?? null, preset.high ?? null)}>
                {preset.label}
              </button>
            );
          })}
          {(low != null || high != null) && (
            <button type="button" className="rk-range-clear" onClick={() => onChange(null, null)}>{labels.clear}</button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Filtros numa linha só, cada um num menu. Tipo, gênero, criador e status só
 * oferecem o que existe em `items`; "Tabelas" (só no Unificado) é a escolha salva
 * de quais tabelas entram no ranking, então o "Limpar" não mexe nela.
 */
export default function FilterPanel({ filters, onChange, onClear, items = [], tables, selectedTableIds, onChangeTables, subcategories = [] }) {
  const { t, locale } = useLanguage();
  const tf = t.rankings.filterPanel;
  const worksLabel = (n) => (n === 1 ? t.rankings.worksOne : t.rankings.worksMany).replace('{n}', n);
  const genreNames = t.rankings.genreNames;
  const typeLabels = t.common.mediaTypes;

  const set = (key, value) => onChange({ ...filters, [key]: value });
  const setMany = (patch) => onChange({ ...filters, ...patch });
  const toggleIn = (key, value) => {
    const list = filters[key] ?? [];
    set(key, list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };
  const single = (key, value) => set(key, filters[key] === value ? null : value);

  const options = useMemo(() => {
    const types = new Set(items.map(item => item.type));
    const genreCount = new Map();
    const creatorCount = new Map();
    const creatorNames = new Map(); // chave → nome mostrado
    items.forEach(item => {
      itemGenres(item).forEach(key => genreCount.set(key, (genreCount.get(key) ?? 0) + 1));
      // obra com dois criadores aparece nos dois (mesma regra da tela de Criadores)
      // e grafias que só diferem em acento/maiúscula viram uma opção (a primeira que apareceu)
      splitCreators(item.sub).forEach(name => {
        const key = creatorKey(name);
        if (!creatorNames.has(key)) creatorNames.set(key, name);
        const shown = creatorNames.get(key);
        creatorCount.set(shown, (creatorCount.get(shown) ?? 0) + 1);
      });
    });
    const byCount = (labelOf) => (a, b) => b[1] - a[1] || labelOf(a[0]).localeCompare(labelOf(b[0]));
    const years = items.map(item => getYear(item.releaseDate)).filter(Boolean);
    const hours = items.map(item => (item.timeMinutes || 0) / 60);
    const notes = items.map(item => item.note).filter(n => n != null);
    return {
      types: TYPE_ORDER.filter(type => types.has(type)),
      genres: [...genreCount].sort(byCount(key => genreLabel(key, genreNames))).map(([key]) => key),
      creators: [...creatorCount].sort(byCount(name => name)).map(([name]) => name),
      statuses: ['ongoing', 'finished'].filter(group => items.some(item => statusGroup(item.details?.status) === group)),
      // trilhos vão do menor ao maior valor que existe nas obras
      yearMin: years.length ? Math.floor(Math.min(...years) / 10) * 10 : 1950,
      yearMax: years.length ? Math.max(...years) : 2030,
      hoursMax: Math.max(1, Math.ceil(Math.max(0, ...hours))),
      years, hours, notes,
    };
  }, [items, genreNames]);

  const num = (n) => Number(n).toLocaleString(locale, { maximumFractionDigits: 1 });
  const rangeValue = (lo, hi, format) => {
    if (lo != null && hi != null) return lo === hi ? format(lo) : `${format(lo)}–${format(hi)}`;
    if (lo != null) return `${format(lo)}+`;
    if (hi != null) return tf.upTo.replace('{v}', format(hi));
    return null;
  };

  const typeValue = filters.types?.length ? summary(filters.types.map(type => typeLabels[type] ?? type)) : null;
  const genreValue = filters.genres?.length ? summary(filters.genres.map(key => genreLabel(key, genreNames))) : null;
  const creatorValue = filters.creators?.length ? summary(filters.creators) : null;
  const noteValue = rangeValue(filters.noteMin, filters.noteMax, num);
  const yearValue = rangeValue(filters.yearMin, filters.yearMax, String);
  const hoursValue = rangeValue(filters.hoursMin, filters.hoursMax, (h) => `${num(h)}h`);
  const moreCount = [filters.status, filters.addedFrom || filters.addedTo].filter(Boolean).length;
  const subValue = filters.subcategory === 'none' ? tf.noSubcategory
    : subcategories.find(sub => sub.id === filters.subcategory)?.name ?? null;

  const allTables = tables && selectedTableIds.length === tables.length;
  const tablesValue = tables && !allTables
    ? summary(tables.filter(table => selectedTableIds.includes(table.id)).map(table => tableName(table.label))) : null;

  function toggleTable(id) {
    if (selectedTableIds.includes(id)) {
      if (selectedTableIds.length === 1) return;
      onChangeTables(selectedTableIds.filter(x => x !== id));
    } else {
      onChangeTables([...selectedTableIds, id]);
    }
  }

  // atalhos de data partem de hoje (calculado no clique, não na renderização)
  function addedShortcut(kind) {
    const now = Date.now();
    const from = kind === 'year' ? `${new Date(now).getFullYear()}-01-01` : isoDay(now - kind * DAY);
    setMany({ addedFrom: from, addedTo: null });
  }

  return (
    <div className="rk-filterbar" role="group" aria-label={t.rankings.filters}>
      <label className="rk-search">
        <Search size={15} strokeWidth={1.8} aria-hidden="true" />
        <input
          type="search"
          aria-label={tf.search}
          value={filters.search ?? ''}
          placeholder={tf.searchPlaceholder}
          onChange={event => set('search', event.target.value)}
        />
      </label>

      {tables && onChangeTables && (
        <FilterMenu label={tf.tables} value={tablesValue} clearLabel={tf.clear}
          onClear={() => onChangeTables(tables.map(table => table.id))}>
          {tables.map(table => {
            const active = selectedTableIds.includes(table.id);
            return (
              <Option key={table.id} checked={active} disabled={active && selectedTableIds.length === 1} onClick={() => toggleTable(table.id)}>
                {tableName(table.label)}
              </Option>
            );
          })}
        </FilterMenu>
      )}

      {subcategories.length > 0 && (
        <FilterMenu label={tf.subcategory} value={subValue} clearLabel={tf.clear} onClear={() => set('subcategory', null)}>
          {subcategories.map(sub => (
            <Option key={sub.id} checked={filters.subcategory === sub.id} onClick={() => single('subcategory', sub.id)}>{sub.name}</Option>
          ))}
          <Option checked={filters.subcategory === 'none'} onClick={() => single('subcategory', 'none')}>{tf.noSubcategory}</Option>
        </FilterMenu>
      )}

      {options.types.length > 1 && (
        <FilterMenu label={tf.type} value={typeValue} clearLabel={tf.clear} onClear={() => set('types', [])}>
          {options.types.map(type => (
            <Option key={type} checked={!!filters.types?.includes(type)} onClick={() => toggleIn('types', type)}>
              {typeLabels[type] ?? typeLabels.outro}
            </Option>
          ))}
        </FilterMenu>
      )}

      {options.genres.length > 0 && (
        <FilterMenu label={tf.genre} value={genreValue} clearLabel={tf.clear} onClear={() => set('genres', [])}>
          {options.genres.map(key => (
            <Option key={key} checked={!!filters.genres?.includes(key)} onClick={() => toggleIn('genres', key)}>
              {genreLabel(key, genreNames)}
            </Option>
          ))}
        </FilterMenu>
      )}

      {options.creators.length > 0 && (
        <FilterMenu label={tf.creator} value={creatorValue} clearLabel={tf.clear} onClear={() => set('creators', [])}>
          {options.creators.map(name => (
            <Option key={name} checked={!!filters.creators?.includes(name)} onClick={() => toggleIn('creators', name)}>{name}</Option>
          ))}
        </FilterMenu>
      )}

      <FilterMenu label={tf.note} value={noteValue} clearLabel={tf.clear} wide onClear={() => setMany({ noteMin: null, noteMax: null })}>
        <RangeControl min={0} max={10} step={0.1} low={filters.noteMin} high={filters.noteMax} labels={tf} worksLabel={worksLabel}
          values={options.notes} format={num}
          onChange={(lo, hi) => setMany({ noteMin: lo, noteMax: hi })} />
      </FilterMenu>

      <FilterMenu label={tf.release} value={yearValue} clearLabel={tf.clear} wide onClear={() => setMany({ yearMin: null, yearMax: null })}>
        <RangeControl min={Math.min(options.yearMin, filters.yearMin ?? Infinity, filters.yearMax ?? Infinity)}
          max={Math.max(options.yearMax, filters.yearMax ?? -Infinity, filters.yearMin ?? -Infinity)} step={1}
          low={filters.yearMin} high={filters.yearMax} labels={tf} worksLabel={worksLabel} values={options.years}
          presets={[
            { label: tf.pre1980, high: 1979 },
            ...DECADES.map(d => ({ label: d < 2000 ? `${d % 100}s` : `${d}s`, low: d, high: d + 9 })),
          ]}
          onChange={(lo, hi) => setMany({ yearMin: lo, yearMax: hi })} />
      </FilterMenu>

      <FilterMenu label={tf.time} value={hoursValue} clearLabel={tf.clear} wide onClear={() => setMany({ hoursMin: null, hoursMax: null })}>
        <RangeControl min={0} max={options.hoursMax} step={1} low={filters.hoursMin} high={filters.hoursMax} labels={tf} worksLabel={worksLabel} suffix="h"
          values={options.hours} format={num}
          onChange={(lo, hi) => setMany({ hoursMin: lo, hoursMax: hi })} />
      </FilterMenu>

      <FilterMenu label={tf.more} value={moreCount ? String(moreCount) : null} clearLabel={tf.clear} wide
        onClear={() => setMany({ status: null, addedFrom: null, addedTo: null })}>
        {options.statuses.length > 0 && (
          <>
            <div className="mr-menu-label rk-more-label" aria-hidden="true">{tf.status}</div>
            <div className="rk-presets">
              {options.statuses.map(group => (
                <button key={group} type="button" className={filters.status === group ? 'is-active' : ''} aria-pressed={filters.status === group}
                  onClick={() => single('status', group)}>
                  {tf[group]}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="mr-menu-label rk-more-label" aria-hidden="true">{tf.added}</div>
        <div className="rk-range-fields rk-date-fields">
          <label>
            <span>{tf.from}</span>
            <input type="date" value={filters.addedFrom ?? ''} onChange={event => set('addedFrom', event.target.value || null)} />
          </label>
          <label>
            <span>{tf.to}</span>
            <input type="date" value={filters.addedTo ?? ''} onChange={event => set('addedTo', event.target.value || null)} />
          </label>
        </div>
        <div className="rk-presets">
          <button type="button" onClick={() => addedShortcut(7)}>{tf.days7}</button>
          <button type="button" onClick={() => addedShortcut(30)}>{tf.days30}</button>
          <button type="button" onClick={() => addedShortcut('year')}>{tf.thisYear}</button>
        </div>
      </FilterMenu>

      {activeFilterCount(filters) > 0 && (
        <button type="button" className="mr-btn mr-btn-ghost mr-btn-sm" onClick={onClear}>{tf.clear}</button>
      )}
    </div>
  );
}
