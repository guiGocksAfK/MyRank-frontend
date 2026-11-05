import { Fragment, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, LayoutGrid, List, UserRound } from 'lucide-react';
import { getUnifiedWorks } from '../../services/WorkService';
import { mapWorkToItem } from '../../utils/mapWork';
import { useLanguage } from '../../shared/i18n';
import InfoTip from '../../shared/components/InfoTip';
import { hasSquareCover, tableName } from '../../shared/tableTemplates';
import { creatorKey, splitCreators } from '../../shared/creatorNames';
import AnimatedNumber from '../rankings/rankings/AnimatedNumber';
import '../rankings/rankings/rankings.css';
import './creators.css';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

// Ranking de criadores derivado das obras reais do usuário (/works/unified),
// agrupadas por `creator`. Mesma linguagem visual da aba Rankings (rk-*).

const TYPE_OPTIONS = ['Diretor', 'Escritor', 'Studio', 'Criador'];
const ORDERS = [
  { id: 'avg', label: 'sortAvg' },
  { id: 'weighted', label: 'sortWeighted' },
  { id: 'works', label: 'sortWorks' },
];
const VOLUME_BONUS_CAP = 1;
const COLS = '2.25rem 60px minmax(0, 1fr) 72px 32px';

function creatorType(template) {
  return { book: 'Escritor', manga: 'Escritor', game: 'Studio', anime: 'Studio', movie: 'Diretor', tv: 'Diretor' }[template] ?? 'Criador';
}

/** Tipo predominante entre as obras de um criador. */
function dominantType(works) {
  const counts = {};
  works.forEach(w => {
    const type = creatorType(w.template);
    counts[type] = (counts[type] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Criador';
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const mean = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

/** Nota do criador. `raw` = média pura; `value` = a que ordena (na Ponderada, pesa o tempo + bônus de volume). */
function scoreOf(works, weighted) {
  const rated = works.filter(w => num(w.note) > 0);
  if (rated.length === 0) return { raw: 0, value: 0 };
  const raw = mean(rated.map(w => num(w.note)));
  if (!weighted) return { raw, value: raw };
  const totalMin = rated.reduce((s, w) => s + num(w.timeMinutes), 0);
  const timeWeighted = totalMin > 0
    ? rated.reduce((s, w) => s + num(w.note) * num(w.timeMinutes), 0) / totalMin
    : raw;
  const volumeBonus = Math.min(Math.log10(rated.length), VOLUME_BONUS_CAP);
  return { raw, value: Math.min(timeWeighted + volumeBonus, 12) };
}

/** Leque de até 3 capas das obras do criador (a parte boa da tela antiga). */
function CoverFan({ works }) {
  const covers = works.map(w => w.image).filter(Boolean).slice(0, 3);
  if (covers.length === 0) {
    return <span className="cr-fan-empty" aria-hidden="true"><UserRound size={18} strokeWidth={1.6} /></span>;
  }
  return (
    <span className="cr-fan" aria-hidden="true">
      {covers.map((src, i) => (
        <img key={i} src={src} alt="" loading="lazy" style={{ zIndex: covers.length - i }} />
      ))}
    </span>
  );
}

/** Capa do grid: mosaico 2x2 com 4+ obras, senão a capa da melhor. */
function CoverMosaic({ works }) {
  const covers = works.map(w => w.image).filter(Boolean);
  if (covers.length === 0) {
    return <span className="rk-gcard-empty"><UserRound size={28} strokeWidth={1.4} aria-hidden="true" /></span>;
  }
  if (covers.length >= 4) {
    return (
      <span className="cr-mosaic" aria-hidden="true">
        {covers.slice(0, 4).map((src, i) => <img key={i} src={src} alt="" loading="lazy" />)}
      </span>
    );
  }
  return <img className="rk-gcard-img" src={covers[0]} alt="" loading="lazy" />;
}

export default function CreatorsPanel({ onBack }) {
  const { t, locale } = useLanguage();
  const tc = t.creators;
  const [order, setOrder] = useState('avg');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [expanded, setExpanded] = useState([]);
  const [works, setWorks] = useState(null); // obras mapeadas + creator/categoryName; null = carregando
  const weighted = order === 'weighted';

  useEffect(() => {
    let active = true;
    getUnifiedWorks()
      .then((data) => {
        if (!active) return;
        setWorks((Array.isArray(data) ? data : []).map((w) => ({
          ...mapWorkToItem(w),
          creator: (w.creator || '').trim(),
          categoryName: w.categoryName,
        })));
      })
      .catch(() => active && setWorks([]));
    return () => { active = false; };
  }, []);

  const loading = works === null;

  // Agrupa por pessoa: obra com dois criadores conta pros dois; grafias que só
  // diferem em acento/maiúscula se juntam, com o nome escrito do jeito mais usado
  const allCreators = useMemo(() => {
    if (!works) return [];
    const groups = new Map(); // chave → { spellings, works }
    for (const w of works) {
      for (const name of splitCreators(w.creator)) {
        const key = creatorKey(name);
        if (!groups.has(key)) groups.set(key, { spellings: new Map(), works: [] });
        const group = groups.get(key);
        group.spellings.set(name, (group.spellings.get(name) ?? 0) + 1);
        group.works.push(w);
      }
    }
    return [...groups.values()].map(({ spellings, works: ws }) => ({
      name: [...spellings].sort((a, b) => b[1] - a[1])[0][0],
      type: dominantType(ws),
      count: ws.length,
      works: ws,
    }));
  }, [works]);

  const typeCounts = useMemo(() => {
    const acc = {};
    allCreators.forEach(a => { acc[a.type] = (acc[a.type] ?? 0) + 1; });
    return acc;
  }, [allCreators]);
  // só oferece os tipos que existem (esconde "Escritores"/"Outros" quando vazios)
  const availableTypes = TYPE_OPTIONS.filter(type => typeCounts[type] > 0);

  const sorted = useMemo(() => {
    const list = (typeFilter === 'all' ? allCreators : allCreators.filter(a => a.type === typeFilter))
      .map(a => ({ ...a, score: scoreOf(a.works, weighted) }));
    return list.sort((a, b) => (order === 'works'
      ? b.count - a.count || b.score.value - a.score.value
      : b.score.value - a.score.value || b.count - a.count));
  }, [allCreators, typeFilter, weighted, order]);

  const toggle = name => setExpanded(prev => (prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]));
  const worksLabel = n => `${n} ${n === 1 ? tc.workOne : tc.workMany}`;
  const typeLabel = type => tc.typeLabels[type] ?? type;

  let body;
  if (loading) body = <p className="rk-empty">{tc.loading}</p>;
  else if (allCreators.length === 0) body = <p className="rk-empty">{tc.emptyHint}</p>;
  else if (sorted.length === 0) body = <p className="rk-empty">{tc.noneFiltered}</p>;
  else if (viewMode === 'grid') {
    body = (
      <div className="rk-grid">
        {sorted.map((author, i) => (
          <div key={author.name} className={`rk-gcard mr-rankings-enter cr-gcard${i < 3 ? ' is-top' : ''}`}
            style={{ '--rank-delay': `${Math.min(i, 12) * 35}ms` }}>
            <div className="rk-gcard-cover"><CoverMosaic works={author.works} /></div>
            <div className="rk-gcard-info">
              <span className="rk-gcard-rank" aria-hidden="true">{i + 1}</span>
              <div className="rk-gcard-text">
                <div className="rk-gcard-title" title={author.name}>{author.name}</div>
                <div className="rk-gcard-sub">
                  <span className="rk-gcard-context">{order === 'works' ? worksLabel(author.count) : typeLabel(author.type)}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="rk-gcard-value"><AnimatedNumber value={author.score.value} locale={locale} /></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div>
        <div className="rk-header" style={{ '--rk-cols': COLS }}>
          <span>#</span>
          <span />
          <span>{typeLabel('Criador')}</span>
          <span>{weighted ? tc.sortWeighted : tc.sortAvg}</span>
          <span />
        </div>
        {sorted.map((author, i) => {
          const isOpen = expanded.includes(author.name);
          const shown = [...author.works].sort((a, b) => (weighted
            ? num(b.finalNote ?? b.note) - num(a.finalNote ?? a.note)
            : num(b.note) - num(a.note)));
          return (
            <Fragment key={author.name}>
              <div
                className={`rk-row mr-rankings-enter cr-row${i < 3 ? ' is-top' : ''}${isOpen ? ' is-open' : ''}`}
                style={{ '--rk-cols': COLS, '--rank-delay': `${Math.min(i, 12) * 35}ms` }}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-label={fmt(tc.expandWorks, { name: author.name })}
                onClick={() => toggle(author.name)}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(author.name); } }}
              >
                <span className="rk-rank">{i + 1}</span>
                <CoverFan works={shown} />
                <div className="rk-main">
                  <div className="rk-title">{author.name}</div>
                  <div className="rk-sub">{typeLabel(author.type)} · {worksLabel(author.count)}</div>
                </div>
                <span className="rk-score"><AnimatedNumber value={author.score.value} locale={locale} /></span>
                <ChevronDown className="cr-chevron" size={18} strokeWidth={1.8} aria-hidden="true" />
              </div>

              {isOpen && (
                <div className="cr-works">
                  {weighted && <p className="cr-works-note">{fmt(tc.realAvg, { avg: author.score.raw.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}</p>}
                  <ul>
                    {shown.map(work => (
                      <li key={work.id}>
                        <span className={`cr-work-cover${hasSquareCover(work.template) ? ' is-square' : ''}`}>
                          {work.image && <img src={work.image} alt="" loading="lazy" />}
                        </span>
                        <span className="cr-work-text">
                          <span className="cr-work-title">{work.title}</span>
                          <span className="cr-work-sub">{tableName(work.categoryName ?? '')}</span>
                        </span>
                        <span className="cr-work-note">
                          <AnimatedNumber value={weighted ? num(work.finalNote ?? work.note) : num(work.note)} locale={locale} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rk-page creators-panel">
      <div>
        {onBack && (
          <button type="button" className="cr-back" onClick={onBack}>
            <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
            {tc.back}
          </button>
        )}
        <div className="cr-head">
          <h1 className="rk-page-title">{tc.title}</h1>
          <InfoTip label={tc.helpLabel} title={tc.helpTitle}>
            <span className="mr-infotip-text">{tc.help}</span>
            <span className="mr-infotip-text">{tc.helpWeighted}</span>
          </InfoTip>
        </div>
      </div>

      <div className="rk-controls">
        <div className="rk-seg" role="group" aria-label={tc.sortLabel}>
          {ORDERS.map(o => (
            <button key={o.id} type="button" className={order === o.id ? 'is-active' : ''} aria-pressed={order === o.id} onClick={() => setOrder(o.id)}>
              {tc[o.label]}
            </button>
          ))}
        </div>
        {availableTypes.length > 1 && (
          <div className="rk-seg" role="group" aria-label={tc.typeLabel}>
            <button type="button" className={typeFilter === 'all' ? 'is-active' : ''} aria-pressed={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
              {tc.all} <span className="cr-seg-count">{allCreators.length}</span>
            </button>
            {availableTypes.map(type => (
              <button key={type} type="button" className={typeFilter === type ? 'is-active' : ''} aria-pressed={typeFilter === type} onClick={() => setTypeFilter(type)}>
                {tc.typePlural[type]} <span className="cr-seg-count">{typeCounts[type]}</span>
              </button>
            ))}
          </div>
        )}
        <div className="rk-seg" role="group" aria-label={tc.viewLabel}>
          <button type="button" className={viewMode === 'list' ? 'is-active' : ''} aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')} title={tc.viewList} aria-label={tc.viewList}>
            <List size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} title={tc.viewGrid} aria-label={tc.viewGrid}>
            <LayoutGrid size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        {!loading && (
          <span className="rk-count">{fmt(sorted.length === 1 ? tc.count[0] : tc.count[1], { n: sorted.length })}</span>
        )}
      </div>

      {body}
    </div>
  );
}
