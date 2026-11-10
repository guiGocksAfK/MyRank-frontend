import { useCallback, useEffect, useMemo, useState } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import { socialApi, tasteKey } from './socialData';
import { useLanguage } from '../../shared/i18n';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useUser } from '../../shared/userContext';
import TakeComposer from './TakeComposer';
import ActivityCard from './ActivityCard';
import SocialEmpty from './SocialEmpty';
import FeedStart from './FeedStart';

/**
 * `onItems`: avisa o que foi carregado, pro trilho montar o "Em alta".
 * `filter`: { key, title } de uma obra do "Em alta"; o feed mostra só o que fala dela.
 * `scope`: 'all' | 'following' (vem do backend). `kind`: 'all' | 'takes' | 'ratings'.
 * `filters`: as abas Todos | Seguindo e o menu de tipo, logo abaixo da caixa de escrever.
 */
export default function SocialFeed({
  onOpenUser, onNavigate, onGoPeople, onItems, filter, onClearFilter,
  scope = 'all', kind = 'all', filters = null,
}) {
  const { t } = useLanguage();
  const tf = t.social.feed;
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false); // a carga falhou: erro com "Tentar de novo", não feed vazio
  const { items: myItems } = useUnifiedItems();
  const { user } = useUser();

  // suas notas por título, pra mostrar ao lado da nota de quem postou
  const myScores = useMemo(() => {
    const map = new Map();
    (myItems || []).forEach((i) => {
      const n = Number(i.note);
      if (i.title && Number.isFinite(n) && n > 0) map.set(tasteKey(i.title, i.type), n);
    });
    return map;
  }, [myItems]);
  // nos seus próprios posts não faz sentido comparar
  const myScoreOf = (item) => (work) => {
    if (!work?.title || item.actor?.username === user?.username) return null;
    return myScores.get(tasteKey(work.title, work.type)) ?? null;
  };

  const load = useCallback(() => {
    socialApi.getFeed(0, 20, scope)
      .then((r) => { setItems(r); setFailed(false); })
      .catch(() => setFailed(true));
  }, [scope]);

  const retry = () => {
    setFailed(false);
    load();
  };

  useEffect(load, [load]);
  useEffect(() => { onItems?.(items); }, [items, onItems]);

  const handleReact = useCallback(
    (activityId, kind) => socialApi.react(activityId, kind),
    [],
  );

  const handlePost = useCallback(
    (payload) => socialApi.postTake(payload).then(load),
    [load],
  );

  const handleEdited = useCallback((updated) => {
    setItems((prev) => (prev || []).map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const handleDeleted = useCallback((id) => {
    setItems((prev) => (prev || []).filter((i) => i.id !== id));
  }, []);

  const mentions = (item, key) => (item.type === 'RATED_DAY' ? item.works : [item.work])
    .some((w) => w?.title && tasteKey(w.title, w.type) === key);
  const ofKind = (it) => kind === 'all' || (kind === 'takes' ? it.type === 'TAKE' : it.type === 'RATED_DAY');
  const shown = items ? items.filter((it) => ofKind(it) && (!filter || mentions(it, filter.key))) : items;

  return (
    <div className="social-feed-col">
      <TakeComposer items={myItems} onPost={handlePost} onNavigate={onNavigate} />
      {filters}

      {filter && (
        <div className="social-feed-filter">
          <span>{tf.filtering} <b>{filter.title}</b></span>
          <button type="button" className="social-icon-btn" aria-label={tf.clearFilter} title={tf.clearFilter} onClick={onClearFilter}>
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}

      {items === null && failed ? (
        <SocialEmpty role="alert" icon={TriangleAlert} text={tf.loadError} actionLabel={tf.retry} onAction={retry} />
      ) : items === null ? (
        <SocialEmpty text={tf.loading} />
      ) : items.length === 0 ? (
        <FeedStart onOpenUser={onOpenUser} onGoPeople={onGoPeople} onFollowed={load} />
      ) : shown.length === 0 ? (
        <SocialEmpty compact text={filter ? tf.filterEmpty : tf.kindEmpty} />
      ) : (
        shown.map((item) => (
          <ActivityCard
            key={item.id}
            item={item}
            myScoreOf={myScoreOf(item)}
            onReact={handleReact}
            onOpenUser={onOpenUser}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
          />
        ))
      )}
    </div>
  );
}
