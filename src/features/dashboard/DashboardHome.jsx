import { useEffect, useMemo, useState } from 'react';
import { useBadges } from '../../shared/badges';
import { useWorks } from '../../shared/worksContext';
import { getStoredUser } from '../../services/authService';
import { useUser } from '../../shared/userContext';
import { useLanguage } from '../../shared/i18n';
import { relativeTime } from '../../shared/useUnifiedItems';
import { getCategories } from '../../services/CategoryService';
import { getWorksByCategory } from '../../services/WorkService';
import { getGroups } from '../../services/masterTableGroupService';
import { getLatestInsights } from '../../services/insightsService';
import { mapWorkToItem } from '../../utils/mapWork';
import { sortItems } from '../../utils/formatters';
import { hasSquareCover } from '../../shared/tableTemplates';
import AnimatedNumber from '../rankings/rankings/AnimatedNumber';
import BadgeIcon from '../../shared/badgeIcons';

const typeIcons = {
  filme: '🎬',
  jogo: '🎮',
  serie: '📺',
  livro: '📚',
};

function getTableOrderKey() {
  const userKey = localStorage.getItem('myrank_username') || 'anonymous';
  return `myrank_table_order_${userKey}`;
}

function orderCategories(categories) {
  const savedOrder = (() => {
    try {
      const parsedOrder = JSON.parse(localStorage.getItem(getTableOrderKey()) || '[]');
      return Array.isArray(parsedOrder) ? parsedOrder : [];
    } catch {
      return [];
    }
  })();

  const categoryById = new Map(categories.map(category => [String(category.id), category]));
  const ordered = savedOrder.map(id => categoryById.get(String(id))).filter(Boolean);
  const orderedIds = new Set(ordered.map(category => String(category.id)));
  return [...ordered, ...categories.filter(category => !orderedIds.has(String(category.id)))];
}

function getUnifiedItemKey(item) {
  return `${item._tableId}:${item.id}`;
}

function applyUnifiedOrder(items, savedOrder = []) {
  const itemByKey = new Map(items.map(item => [getUnifiedItemKey(item), item]));
  const ordered = savedOrder.map(key => itemByKey.get(key)).filter(Boolean);
  const orderedKeys = new Set(ordered.map(getUnifiedItemKey));
  return [...ordered, ...items.filter(item => !orderedKeys.has(getUnifiedItemKey(item)))];
}

/** Capa da obra, ou o título sobre fundo escuro quando não tem imagem. */
function PosterCover({ item }) {
  return item.image ? (
    <img src={item.image} alt={item.title} loading="lazy" className="dash-cover-img" />
  ) : (
    <div className="mr-poster-placeholder">
      <span className="mr-poster-placeholder-icon">{typeIcons[item.type] || '📦'}</span>
      <span className="mr-poster-placeholder-title">{item.title}</span>
    </div>
  );
}

export default function DashboardHome({ onNavigate }) {
  const [weighted, setWeighted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [unifiedOrder, setUnifiedOrder] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  // "agora" fixo na montagem: decide quais conquistas ganham a etiqueta de nova
  const [now] = useState(() => Date.now());
  // null = ainda carregando (ou falhou): a seção nem aparece
  const [recos, setRecos] = useState(null);
  const { user } = useUser();
  const { worksVersion } = useWorks();
  const { lang, locale, t } = useLanguage();
  const th = t.dash.home;
  const typeLabels = t.common.mediaTypes;
  const storedUser = useMemo(() => getStoredUser(), []);
  const userName = user?.username || storedUser?.username || 'usuário';

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      try {
        const categories = orderCategories(await getCategories());
        let selectedCategoryIds = categories.map(category => String(category.id));
        try {
          const groups = await getGroups();
          const unifiedGroup = groups.find(group => group.name === 'Unificado');
          if (unifiedGroup?.categoryIds?.length) {
            selectedCategoryIds = unifiedGroup.categoryIds.map(categoryId => String(categoryId));
          }
          if (!cancelled) setUnifiedOrder(unifiedGroup?.manualOrder || []);
        } catch {
          // A Home continua funcional mesmo se o grupo unificado não estiver disponível.
        }
        const itemsByCategory = await Promise.all(categories.map(async category => {
          const works = await getWorksByCategory(category.id);
          if (!selectedCategoryIds.includes(String(category.id))) return [];
          // o tipo vem do template da obra (mapWorkToItem); antes vinha do nome da tabela
          // e "Shingeki" numa "Séries & Animes" aparecia como série
          return works.map(work => ({ ...mapWorkToItem(work), _tableId: category.id }));
        }));
        if (!cancelled) setMediaItems(itemsByCategory.flat());
      } catch {
        if (!cancelled) setMediaItems([]);
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    }

    loadItems();
    return () => { cancelled = true; };
  }, [worksVersion]);

  useEffect(() => {
    let cancelled = false;
    getLatestInsights()
      .then((latest) => {
        // até 3 na lista; o back antigo (antes do deploy) ainda manda uma só em `recommendation`
        const analysis = latest?.analysis;
        const list = analysis?.recommendations ?? (analysis?.recommendation ? [analysis.recommendation] : []);
        if (!cancelled) setRecos(list.filter((reco) => reco?.title));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const { badges: badgeData } = useBadges();
  const badges = badgeData || [];
  const unlockedBadges = badges.filter((b) => b.unlocked).length;
  const totalBadges = badges.length;
  const getNote = (item) => weighted ? item.finalNote : item.note;

  const { totalHours, avgNote, top, recentItems } = useMemo(() => ({
    totalHours: Math.round(mediaItems.reduce((sum, item) => sum + (item.timeMinutes || 0), 0) / 60),
    avgNote: mediaItems.length
      ? (mediaItems.reduce((sum, item) => sum + (item.note || 0), 0) / mediaItems.length).toFixed(1)
      : '0.0',
    top: sortItems(applyUnifiedOrder(mediaItems, unifiedOrder), 'nota', weighted).slice(0, 6),
    recentItems: [...mediaItems]
      .sort((a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0))
      .slice(0, 5),
  }), [mediaItems, weighted, unifiedOrder]);

  const recentBadges = badges
    .filter((b) => b.unlocked)
    .sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0))
    .slice(0, 5);

  const stats = [
    { value: mediaItems.length, label: th.statRated },
    { value: Number(avgNote), label: th.statAvg, decimals: 1 },
    { value: totalHours, label: th.statHours, suffix: 'h' },
    { value: `${unlockedBadges}/${totalBadges}`, label: th.statBadges },
  ];

  return (
    <div className="mr-space-y-6">
      <header className="dash-hello">
        <span className="dash-eyebrow">{th.eyebrow}</span>
        <h1 className="dash-hello-title">
          {th.greeting.split('{name}')[0]}
          <span className="dash-hello-name">{userName}</span>
          {th.greeting.split('{name}')[1]}
        </h1>
      </header>

      {/* Números numa faixa só: brancos, sem enfeite; o dourado fica pro Hall da fama */}
      <div className="mr-panel dash-stats">
        {stats.map((stat, i) => (
          <div className="dash-stat" key={stat.label}>
            <div className="dash-stat-value">
              {loadingItems && i < 3
                ? '…'
                : typeof stat.value === 'number'
                ? <AnimatedNumber value={stat.value} decimals={stat.decimals ?? 0} suffix={stat.suffix} locale={locale} />
                : stat.value}
            </div>
            <div className="dash-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="mr-section-header">
          <h2 className="mr-section-title">{th.favorites}</h2>
          <div className="mr-flex mr-items-center mr-gap-2">
            <span style={{ color: 'var(--mr-text-secondary)', fontSize: '0.75rem' }}>{th.weighted}</span>
            <div style={{ position: 'relative' }}>
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                aria-label={th.weightedTipAria}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '1px solid var(--mr-border)', background: 'transparent',
                  color: 'var(--mr-text-muted)', fontSize: '0.6875rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', lineHeight: 1, padding: 0,
                }}
              >?</button>
              {showTooltip && (
                <div style={{
                  position: 'absolute', right: 0, bottom: 'calc(100% + 8px)', width: 230,
                  background: '#1a1a1a', border: '1px solid #303030', borderRadius: 10,
                  padding: '10px 12px', fontSize: '0.75rem', color: 'var(--mr-text-secondary)',
                  lineHeight: 1.5, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  <span style={{ color: 'var(--mr-gold)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                    {th.weightedTitle}
                  </span>
                  {th.weightedTip}
                  <span style={{ color: 'var(--mr-gold)', fontFamily: 'monospace', display: 'block', marginTop: 4 }}>
                    Nota + log₁₀(Tempo / 60min)
                  </span>
                </div>
              )}
            </div>
            <button
              className={`mr-switch ${weighted ? 'checked' : ''}`}
              onClick={() => setWeighted((prev) => !prev)}
              aria-label="Ativar ponderação por tempo"
            >
              <div className="mr-switch-thumb" />
            </button>
          </div>
        </div>
        {/* 6 capas iguais; posição, título e nota embaixo, fora da arte */}
        <ol className="dash-top">
          {loadingItems ? Array.from({ length: 6 }, (_, index) => (
            <li className="dash-top-item" key={`skeleton-${index}`} aria-hidden="true">
              <div className="mr-poster mr-skeleton-poster"><div className="mr-poster-inner" /></div>
            </li>
          )) : top.map((item, index) => (
            <li
              className={`dash-top-item mr-rankings-enter${index === 0 ? ' is-first' : ''}`}
              style={{ '--rank-delay': `${index * 35}ms` }}
              key={getUnifiedItemKey(item)}
            >
              <div className="mr-poster">
                <div className={`mr-poster-inner${hasSquareCover(item.template) ? ' is-square' : ''}`}>
                  <PosterCover item={item} />
                </div>
              </div>
              <div className="dash-top-info">
                <span className="dash-top-rank" aria-hidden="true">{index + 1}</span>
                <div className="dash-row-text">
                  <div className="dash-top-title">{item.title}</div>
                  <div className="dash-row-sub">
                    {typeLabels[item.type] ?? typeLabels.outro} · <span className="dash-top-note">
                      <AnimatedNumber value={getNote(item)} locale={locale} />
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="dash-bottom">
        {/* Avaliadas recentemente: lista por data, sem número de posição (não é ranking) */}
        <section className="mr-panel dash-card">
          <h2 className="dash-card-title">{th.recentRatings}</h2>
          {!loadingItems && recentItems.length === 0 ? (
            <p className="dash-empty">{th.noRecent}</p>
          ) : (
            <ul className="dash-list">
              {recentItems.map((item, i) => (
                <li className="dash-row mr-rankings-enter" style={{ '--rank-delay': `${i * 35}ms` }} key={getUnifiedItemKey(item)}>
                  <span className={`dash-thumb${hasSquareCover(item.template) ? ' is-square' : ''}`} aria-hidden="true">
                    {item.image && <img src={item.image} alt="" loading="lazy" />}
                  </span>
                  <div className="dash-row-text">
                    <div className="dash-row-title">{item.title}</div>
                    <div className="dash-row-sub">
                      {typeLabels[item.type] ?? typeLabels.outro} · {relativeTime(item.addedDate, lang)}
                    </div>
                  </div>
                  <span className="dash-row-note">
                    <AnimatedNumber value={item.note} locale={locale} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Conquistas recentes: ícone num medalhão dourado; as dos últimos 7 dias brilham */}
        <section className="mr-panel dash-card">
          <h2 className="dash-card-title">{th.recentBadges}</h2>
          {recentBadges.length === 0 ? (
            <p className="dash-empty">{th.noBadgesYet}</p>
          ) : (
            <ul className="dash-list">
              {recentBadges.map((badge) => {
                const isNew = badge.unlockedAt && now - new Date(badge.unlockedAt) < 7 * 24 * 60 * 60 * 1000;
                return (
                  <li className="dash-row" key={badge.id}>
                    <span className={`dash-medal${isNew ? ' is-new' : ''}`} aria-hidden="true"><BadgeIcon code={badge.id} /></span>
                    <div className="dash-row-text">
                      <div className="dash-row-title">
                        {badge.name}
                        {isNew && <span className="dash-new-tag">{th.newBadge}</span>}
                      </div>
                      <div className="dash-row-sub">
                        {badge.description}
                        {badge.unlockedAt && ` · ${relativeTime(badge.unlockedAt, lang)}`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Recomendado pra você: sai da última análise de IA, sem gastar a cota do dia.
          Quem nunca gerou vê o convite pra aba IA. Antes de responder não mostra nada. */}
      {recos && (
        <section className="mr-panel dash-card">
          {recos.length > 0 ? (
            <>
              <div className="dash-reco-head">
                <h2 className="dash-card-title">{th.recoTitle}</h2>
                <span className="dash-reco-source">{th.recoSource}</span>
              </div>
              <ul className="dash-reco">
                {recos.map((reco) => (
                  <li className="dash-reco-item" key={reco.title}>
                    {typeof reco.compatPercent === 'number' && (
                      <div className="dash-reco-compat">
                        {reco.compatPercent}%<span>{th.recoCompat}</span>
                      </div>
                    )}
                    <div className="dash-reco-title">{reco.title}</div>
                    <div className="dash-row-sub">{[reco.category, reco.year].filter(Boolean).join(' · ')}</div>
                    {reco.reason && <p className="dash-reco-reason">{reco.reason}</p>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="dash-reco-empty">
              <div>
                <h2 className="dash-card-title">{th.recoEmptyTitle}</h2>
                <p className="dash-empty">{th.recoEmptyText}</p>
              </div>
              <button type="button" className="mr-btn mr-btn-gold" onClick={() => onNavigate?.('ai')}>
                {th.recoEmptyCta}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}