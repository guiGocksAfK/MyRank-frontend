import { useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useLanguage } from '../../shared/i18n';
import InfoTip from '../../shared/components/InfoTip';
import { tableName } from '../../shared/tableTemplates';
import Poster from '../rankings/rankings/Poster';
import AnimatedNumber from '../rankings/rankings/AnimatedNumber';
import '../rankings/rankings/rankings.css';
import './insights.css';

const MIN_WORKS_FOR_INSIGHTS = 5;
const COLS = '24px 2.25rem 40px minmax(0, 1fr) minmax(0, 180px) 72px';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * O que a IA vai analisar. O filtro de tabela define o escopo: o que está na tela
 * é o que vai pra IA ("Jogos" analisa só os jogos). As tabelas ligam e desligam,
 * então dá pra somar (Filmes + Jogos); nenhuma ou todas = "Todas". O ✓ de cada
 * linha tira uma obra ou outra; a barra presa no pé resume e gera.
 */
export default function InsightsPanel({ onGenerate }) {
  const { t, locale } = useLanguage();
  const tp = t.insights.panel;
  const { items, loading, error } = useUnifiedItems();

  const works = useMemo(
    () => (items || [])
      .map((it) => ({
        id: it.id,
        title: it.title,
        image: it.image,
        note: num(it.note),
        table: it.categoryName || '',
        timeMinutes: num(it.timeMinutes),
      }))
      .sort((a, b) => b.note - a.note),
    [items],
  );

  // tabelas na ordem de quantidade de obras, com a contagem no filtro
  const tables = useMemo(() => {
    const counts = new Map();
    works.forEach(w => counts.set(w.table, (counts.get(w.table) ?? 0) + 1));
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [works]);

  const [picked, setPicked] = useState(() => new Set()); // vazio = Todas
  const [excluded, setExcluded] = useState(() => new Set()); // obras tiradas uma a uma
  const isAll = picked.size === 0;

  const toggleTable = (name) => setPicked((current) => {
    const next = new Set(current);
    if (next.has(name)) next.delete(name); else next.add(name);
    // todas marcadas uma a uma também é "Todas"
    return next.size === tables.length ? new Set() : next;
  });

  const visible = useMemo(
    () => (isAll ? works : works.filter((w) => picked.has(w.table))),
    [works, picked, isAll],
  );
  const selected = useMemo(() => visible.filter(w => !excluded.has(w.id)), [visible, excluded]);

  const toggle = (id) => setExcluded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const generate = () => {
    if (selected.length < MIN_WORKS_FOR_INSIGHTS) return;
    onGenerate?.(selected.map((w) => w.id));
  };

  if (loading) {
    return (
      <div className="rk-page">
        <div className="insights-skel" style={{ height: 40, width: 220 }} />
        <div className="insights-skel" style={{ height: 34, width: 420 }} />
        <div className="insights-skel" style={{ height: 360 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-state-card">
        <div className="insights-state-title">{tp.loadErrorTitle}</div>
        <div className="insights-state-text">{tp.loadErrorText}</div>
      </div>
    );
  }

  // Com poucas notas o perfil sai genérico; 5 é o mínimo pra dizer algo sobre o gosto.
  if (works.length < MIN_WORKS_FOR_INSIGHTS) {
    return (
      <div className="insights-state-card">
        <Sparkles className="insights-state-icon" size={28} strokeWidth={1.5} aria-hidden="true" />
        <div className="insights-state-title">{tp.minTitle}</div>
        <div className="insights-state-text">
          {fmt(tp.minText, { min: MIN_WORKS_FOR_INSIGHTS, n: MIN_WORKS_FOR_INSIGHTS - works.length })}
        </div>
      </div>
    );
  }

  const count = selected.length;
  const enough = count >= MIN_WORKS_FOR_INSIGHTS;
  const rated = selected.filter(w => w.note > 0);
  const avg = rated.length ? rated.reduce((s, w) => s + w.note, 0) / rated.length : 0;
  const hours = Math.round(selected.reduce((s, w) => s + w.timeMinutes, 0) / 60);

  return (
    <div className="rk-page ai-panel">
      <div className="ai-head">
        <h1 className="rk-page-title">{tp.title}</h1>
        <InfoTip label={tp.helpLabel} title={tp.helpTitle}>
          <span className="mr-infotip-text">{tp.help}</span>
          <span className="mr-infotip-text">{tp.helpSaved}</span>
        </InfoTip>
      </div>

      {tables.length > 1 && (
        <div className="rk-controls">
          <div className="rk-seg" role="group" aria-label={tp.filterLabel}>
            <button type="button" className={isAll ? 'is-active' : ''} aria-pressed={isAll} onClick={() => setPicked(new Set())}>
              {tp.all} <span className="ai-seg-count">{works.length}</span>
            </button>
            {tables.map(([name, n]) => (
              <button key={name} type="button" className={picked.has(name) ? 'is-active' : ''} aria-pressed={picked.has(name)} onClick={() => toggleTable(name)}>
                {tableName(name)} <span className="ai-seg-count">{n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ai-list">
        {visible.map((item, idx) => {
          const on = !excluded.has(item.id);
          return (
            <div
              key={item.id}
              role="checkbox"
              tabIndex={0}
              aria-checked={on}
              aria-label={fmt(tp.toggle, { title: item.title })}
              className={`rk-row mr-rankings-enter ai-row${idx < 3 ? ' is-top' : ''}${on ? ' is-selected' : ''}`}
              style={{ '--rk-cols': COLS, '--rank-delay': `${Math.min(idx, 12) * 30}ms` }}
              onClick={() => toggle(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggle(item.id);
                }
              }}
            >
              <span className="ai-check" aria-hidden="true">{on && <Check size={13} strokeWidth={3} />}</span>
              <span className="rk-rank">{idx + 1}</span>
              <Poster src={item.image} title={item.title} size="thumb" />
              <div className="rk-main">
                <div className="rk-title">{item.title}</div>
                <div className="rk-sub ai-only-mobile">{tableName(item.table)}</div>
              </div>
              <span className="rk-table rk-hide-mobile">{tableName(item.table)}</span>
              <span className="rk-score"><AnimatedNumber value={item.note} locale={locale} /></span>
            </div>
          );
        })}
      </div>

      {/* presa no pé: o que vai pra IA e a ação, à mão em qualquer ponto da lista */}
      <div className="ai-bar">
        <span className="ai-bar-text">
          <strong>{fmt(count === 1 ? tp.works[0] : tp.works[1], { n: count })}</strong>
          {!enough ? (
            <span className="ai-bar-warn">{fmt(tp.minHint, { min: MIN_WORKS_FOR_INSIGHTS })}</span>
          ) : (
            <span>
              {fmt(tp.avg, { avg: avg.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
              {hours > 0 && ` · ${fmt(tp.hours, { n: hours.toLocaleString(locale) })}`}
            </span>
          )}
        </span>
        <button type="button" className="mr-btn mr-btn-gold" onClick={generate} disabled={!enough}>
          <Sparkles size={15} strokeWidth={2} aria-hidden="true" />
          {tp.generate}
        </button>
      </div>
    </div>
  );
}
