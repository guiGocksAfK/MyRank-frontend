import { useEffect, useMemo, useState } from 'react';
import { useBadges } from '../../shared/badges';
import { useWorks } from '../../shared/worksContext';
import { getStoredUser } from '../../services/authService';
import { useUser } from '../../shared/userContext';
import { useLanguage } from '../../shared/i18n';
import { relativeTime, useUnifiedItems } from '../../shared/useUnifiedItems';
import { getGroups } from '../../services/masterTableGroupService';
import { getLatestInsights } from '../../services/insightsService';
import { sortItems } from '../../utils/formatters';
import { TEMPLATE_ICONS, hasSquareCover } from '../../shared/tableTemplates';
import InfoTip from '../../shared/components/InfoTip';
import AnimatedNumber from '../rankings/rankings/AnimatedNumber';
import BadgeIcon from '../../shared/badgeIcons';

function getUnifiedItemKey(item) {
  return `${item._tableId ?? item.categoryId}:${item.id}`;
}

function applyUnifiedOrder(items, savedOrder = []) {
  const itemByKey = new Map(items.map(item => [getUnifiedItemKey(item), item]));
  const ordered = savedOrder.map(key => itemByKey.get(key)).filter(Boolean);
  const orderedKeys = new Set(ordered.map(getUnifiedItemKey));
  return [...ordered, ...items.filter(item => !orderedKeys.has(getUnifiedItemKey(item)))];
}

/** Capa da obra, ou o título sobre fundo escuro quando não tem imagem. */
function PosterCover({ item }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = item.image;
  const Icon = TEMPLATE_ICONS[item.template] ?? TEMPLATE_ICONS.custom;
  return src && failedSrc !== src ? (
    <img src={src} alt={item.title} loading="lazy" className="dash-cover-img" onError={() => setFailedSrc(src)} />
  ) : (
    <div className="mr-poster-placeholder">
      <span className="mr-poster-placeholder-icon" aria-hidden="true">
        <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="mr-poster-placeholder-title">{item.title}</span>
    </div>
  );
}

export default function DashboardHome({ onNavigate }) {
  const [weighted, setWeighted] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(null); // null = todas as tabelas
  const [unifiedOrder, setUnifiedOrder] = useState([]);
  // "agora" fixo na montagem: decide quais conquistas ganham a etiqueta de nova
  const [now] = useState(() => Date.now());
  // null = ainda carregando (ou falhou): a seção nem aparece
  const [recos, setRecos] = useState(null);
  const { user } = useUser();
  // "nota ponderada ligada por padrão" (Configurações): vale ao abrir e quando o ajuste muda
  const weightedDefault = Boolean(user?.weightedByDefault);
  const [seenWeightedDefault, setSeenWeightedDefault] = useState(false); // a nota começa desligada
  if (weightedDefault !== seenWeightedDefault) {
    setSeenWeightedDefault(weightedDefault);
    setWeighted(weightedDefault);
  }
  const { worksVersion } = useWorks();
  const { items: unifiedItems, loading: loadingItems } = useUnifiedItems();
  const { lang, locale, t } = useLanguage();
  const th = t.dash.home;
  const typeLabels = t.common.mediaTypes;
  const storedUser = useMemo(() => getStoredUser(), []);
  const userName = user?.username || storedUser?.username || 'usuário';

  useEffect(() => {
    let cancelled = false;
    getGroups()
      .then((groups) => {
        if (cancelled) return;
        const unifiedGroup = (groups || []).find(group => group.name === 'Unificado');
        setSelectedCategoryIds(
          unifiedGroup?.categoryIds?.length
            ? new Set(unifiedGroup.categoryIds.map(id => String(id)))
            : null,
        );
        setUnifiedOrder(unifiedGroup?.manualOrder || []);
      })
      .catch(() => {
        // A Home continua funcional mesmo se o grupo unificado não estiver disponível.
      });
    return () => { cancelled = true; };
  }, [worksVersion]);

  const mediaItems = useMemo(() => {
    const all = (unifiedItems || []).map(item => ({ ...item, _tableId: item.categoryId }));
    if (!selectedCategoryIds) return all;
    return all.filter(item => item.categoryId != null && selectedCategoryIds.has(String(item.categoryId)));
  }, [unifiedItems, selectedCategoryIds]);

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

  const { totalHours, avgNote, top, recentItems } = useMemo(() => {
    const rated = mediaItems.filter((item) => Number(item.note) > 0);
    return {
      totalHours: Math.round(mediaItems.reduce((sum, item) => sum + (item.timeMinutes || 0), 0) / 60),
      avgNote: rated.length
        ? (rated.reduce((sum, item) => sum + Number(item.note), 0) / rated.length).toFixed(1)
        : '0.0',
      top: sortItems(applyUnifiedOrder(mediaItems, unifiedOrder), 'nota', weighted).slice(0, 6),
      recentItems: [...mediaItems]
        .sort((a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0))
        .slice(0, 5),
    };
  }, [mediaItems, weighted, unifiedOrder]);

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
            <InfoTip label={th.weightedTipAria} title={th.weightedTitle}>
              <span>{th.weightedTip}</span>
              <span style={{ color: 'var(--mr-gold)', fontFamily: 'monospace' }}>
                {th.weightedFormula}
              </span>
            </InfoTip>
            <button
              className={`mr-switch ${weighted ? 'checked' : ''}`}
              type="button"
              role="switch"
              aria-checked={weighted}
              onClick={() => setWeighted((prev) => !prev)}
              aria-label={th.weightedSwitchAria}
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
              <h2 className="dash-card-title">{th.recoTitle}</h2>
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