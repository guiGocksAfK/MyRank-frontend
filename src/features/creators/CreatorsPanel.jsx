import { Fragment, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { getCreatorProfiles } from '../../services/creatorService';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useLanguage } from '../../shared/i18n';
import InfoTip from '../../shared/components/InfoTip';
import { hasSquareCover, tableName } from '../../shared/tableTemplates';
import AnimatedNumber from '../rankings/rankings/AnimatedNumber';
import CreatorAvatar from './CreatorAvatar';
import EditCreatorModal from './EditCreatorModal';
import { groupCreators } from './groupCreators';
import '../rankings/rankings/rankings.css';
import './creators.css';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

// Ranking de criadores derivado das obras reais do usuário (/works/unified). Quem
// junta pessoas, duplas e co-criadores é o groupCreators; as fotos vêm do back.

const TYPE_OPTIONS = ['Diretor', 'Escritor', 'Studio', 'Criador'];
const ORDERS = [
  { id: 'avg', label: 'sortAvg' },
  { id: 'weighted', label: 'sortWeighted' },
  { id: 'works', label: 'sortWorks' },
];
const VOLUME_BONUS_CAP = 1;
const FILMOGRAPHY_MAX = 4;
const PROFILE_RETRIES = 6; // fotos ainda não procuradas: pede de novo algumas vezes
const COLS = '2.25rem 48px minmax(0, 1fr) auto 72px 32px';

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

/** Tipo que vale: o escolhido pelo usuário (se todos da entrada concordam), senão o deduzido. */
function typeOf(entry, profiles) {
  const chosen = entry.members.map(m => profiles[m.key]?.type ?? null);
  return chosen[0] && chosen.every(x => x === chosen[0]) ? chosen[0] : entry.autoType;
}

/** Capas pequenas das obras, como a filmografia do criador. */
function Filmography({ works, more }) {
  const shown = works.slice(0, FILMOGRAPHY_MAX);
  return (
    <span className="cr-films" aria-hidden="true">
      {shown.map(work => (
        <span key={work.id} className={`cr-film${hasSquareCover(work.template) ? ' is-square' : ''}`}>
          {work.image && <img src={work.image} alt="" loading="lazy" />}
        </span>
      ))}
      {works.length > FILMOGRAPHY_MAX && <span className="cr-films-more">{more.replace('{n}', works.length - FILMOGRAPHY_MAX)}</span>}
    </span>
  );
}

export default function CreatorsPanel({ onBack }) {
  const { t, locale } = useLanguage();
  const tc = t.creators;
  const [order, setOrder] = useState('avg');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [expanded, setExpanded] = useState([]);
  // mesma lista do resto do dashboard (WorksProvider); null = carregando
  const { items: works, error: loadFailed } = useUnifiedItems();
  const [profiles, setProfiles] = useState({}); // chave da pessoa → { photoUrl, customPhoto, type }
  const [editing, setEditing] = useState(null);
  const weighted = order === 'weighted';

  const loading = works === null;
  const entries = useMemo(() => (works ? groupCreators(works) : []), [works]);

  // fotos e tipos escolhidos; sem o endpoint (back antigo) ficam as iniciais
  useEffect(() => {
    if (entries.length === 0) return undefined;
    const request = entries.flatMap(entry => entry.members.map(m => ({
      name: m.name, kind: entry.autoType === 'Studio' ? 'COMPANY' : 'PERSON',
    })));
    let active = true;
    let timer;
    const load = (attempt) => {
      getCreatorProfiles(request)
        .then(list => {
          if (!active) return;
          setProfiles(current => ({ ...current, ...Object.fromEntries(list.map(p => [p.key, p])) }));
          if (list.some(p => p.pending) && attempt < PROFILE_RETRIES) timer = setTimeout(() => load(attempt + 1), 1200);
        })
        .catch(() => {});
    };
    load(1);
    return () => { active = false; clearTimeout(timer); };
  }, [entries]);

  const typed = useMemo(() => entries.map(e => ({ ...e, type: typeOf(e, profiles) })), [entries, profiles]);

  const typeCounts = useMemo(() => {
    const acc = {};
    typed.forEach(e => { acc[e.type] = (acc[e.type] ?? 0) + 1; });
    return acc;
  }, [typed]);
  // só oferece os tipos que existem (esconde "Escritores"/"Outros" quando vazios)
  const availableTypes = TYPE_OPTIONS.filter(type => typeCounts[type] > 0);
  const activeType = typeFilter === 'all' || typeCounts[typeFilter] ? typeFilter : 'all';

  const sorted = useMemo(() => {
    const list = (activeType === 'all' ? typed : typed.filter(e => e.type === activeType))
      .map(e => ({ ...e, score: scoreOf(e.works, weighted) }));
    return list.sort((a, b) => (order === 'works'
      ? b.count - a.count || b.score.value - a.score.value
      : b.score.value - a.score.value || b.count - a.count));
  }, [typed, activeType, weighted, order]);

  const toggle = id => setExpanded(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const worksLabel = n => `${n} ${n === 1 ? tc.workOne : tc.workMany}`;
  const typeLabel = type => tc.typeLabels[type] ?? type;
  const noteOf = work => (weighted ? num(work.finalNote ?? work.note) : num(work.note));
  const byNote = list => [...list].sort((a, b) => noteOf(b) - noteOf(a));
  const formatAvg = value => value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const editLabel = entry => `${tc.edit.button} ${entry.name}`;

  let body;
  if (loading) body = <p className="rk-empty">{tc.loading}</p>;
  // falha na busca não pode aparecer como "você não tem obras"
  else if (loadFailed) body = <p className="rk-empty rk-error" role="alert">{t.insights.panel.loadErrorTitle}. {t.insights.panel.loadErrorText}</p>;
  else if (entries.length === 0) body = <p className="rk-empty">{tc.emptyHint}</p>;
  else if (sorted.length === 0) body = <p className="rk-empty">{tc.noneFiltered}</p>;
  else if (viewMode === 'grid') {
    body = (
      <div className="cr-cards">
        {sorted.map((entry, i) => (
          <div key={entry.id} className={`cr-card mr-rankings-enter${i < 3 ? ' is-top' : ''}`}
            style={{ '--rank-delay': `${Math.min(i, 12) * 35}ms` }}>
            <span className="cr-card-rank">{i + 1}</span>
            <CreatorAvatar entry={entry} profiles={profiles} isCompany={entry.type === 'Studio'} size="lg" top={i < 3}
              onEdit={() => setEditing(entry)} editLabel={editLabel(entry)} />
            <div className="cr-card-name" title={entry.name}>{entry.name}</div>
            <div className="cr-card-sub">
              {order === 'works' ? worksLabel(entry.count) : typeLabel(entry.type)}
              {' · '}
              <span className="cr-card-score"><AnimatedNumber value={entry.score.value} locale={locale} /></span>
            </div>
            <Filmography works={byNote(entry.works)} more={tc.more} />
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
          <span className="rk-hide-mobile">{tc.colWorks}</span>
          <span>{weighted ? tc.sortWeighted : tc.sortAvg}</span>
          <span />
        </div>
        {sorted.map((entry, i) => {
          const isOpen = expanded.includes(entry.id);
          const shown = byNote(entry.works);
          return (
            <Fragment key={entry.id}>
              <div
                className={`rk-row mr-rankings-enter cr-row${i < 3 ? ' is-top' : ''}${isOpen ? ' is-open' : ''}`}
                style={{ '--rk-cols': COLS, '--rank-delay': `${Math.min(i, 12) * 35}ms` }}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-label={fmt(tc.expandWorks, { name: entry.name })}
                onClick={() => toggle(entry.id)}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(entry.id); } }}
              >
                <span className="rk-rank">{i + 1}</span>
                <CreatorAvatar entry={entry} profiles={profiles} isCompany={entry.type === 'Studio'} top={i < 3}
                  onEdit={() => setEditing(entry)} editLabel={editLabel(entry)} />
                <div className="rk-main">
                  <div className="rk-title">{entry.name}</div>
                  <div className="rk-sub">{typeLabel(entry.type)} · {worksLabel(entry.count)}</div>
                </div>
                <span className="rk-hide-mobile"><Filmography works={shown} more={tc.more} /></span>
                <span className="rk-score"><AnimatedNumber value={entry.score.value} locale={locale} /></span>
                <ChevronDown className="cr-chevron" size={18} strokeWidth={1.8} aria-hidden="true" />
              </div>

              {isOpen && (
                <div className="cr-works">
                  {weighted && <p className="cr-works-note">{fmt(tc.realAvg, { avg: formatAvg(entry.score.raw) })}</p>}
                  <ul>
                    {shown.map(work => (
                      <li key={work.id}>
                        <span className={`cr-work-cover${hasSquareCover(work.template) ? ' is-square' : ''}`}>
                          {work.image && <img src={work.image} alt="" loading="lazy" />}
                        </span>
                        <span className="cr-work-text">
                          <span className="cr-work-title">{work.title}</span>
                          <span className="cr-work-sub">
                            {tableName(work.categoryName ?? '')}
                            {entry.coCredits[work.id] && ` · ${fmt(tc.withPeople, { names: entry.coCredits[work.id].join(', ') })}`}
                          </span>
                        </span>
                        <span className="cr-work-note"><AnimatedNumber value={noteOf(work)} locale={locale} /></span>
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
            <span className="mr-infotip-text">{tc.helpGroups}</span>
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
            <button type="button" className={activeType === 'all' ? 'is-active' : ''} aria-pressed={activeType === 'all'} onClick={() => setTypeFilter('all')}>
              {tc.all} <span className="cr-seg-count">{typed.length}</span>
            </button>
            {availableTypes.map(type => (
              <button key={type} type="button" className={activeType === type ? 'is-active' : ''} aria-pressed={activeType === type} onClick={() => setTypeFilter(type)}>
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

      {editing && (
        <EditCreatorModal
          entry={editing}
          profiles={profiles}
          onSaved={list => setProfiles(current => ({ ...current, ...Object.fromEntries(list.map(p => [p.key, p])) }))}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
