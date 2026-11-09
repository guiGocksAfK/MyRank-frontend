import { useCallback, useEffect, useMemo, useState } from 'react';
import { Rss } from 'lucide-react';
import { socialApi, normTitle } from './socialData';
import { useLanguage } from '../../shared/i18n';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useUser } from '../../shared/userContext';
import TakeComposer from './TakeComposer';
import ActivityCard from './ActivityCard';
import SocialEmpty from './SocialEmpty';

export default function SocialFeed({ onOpenUser, onNavigate, onGoPeople }) {
  const { t } = useLanguage();
  const tf = t.social.feed;
  const [items, setItems] = useState(null);
  const { items: myItems } = useUnifiedItems();
  const { user } = useUser();

  // suas notas por título, pra mostrar ao lado da nota de quem postou
  const myScores = useMemo(() => {
    const map = new Map();
    (myItems || []).forEach((i) => {
      const n = Number(i.note);
      if (i.title && Number.isFinite(n) && n > 0) map.set(normTitle(i.title), n);
    });
    return map;
  }, [myItems]);
  // nos seus próprios posts não faz sentido comparar
  const myScoreOf = (item) => (work) => {
    if (!work?.title || item.actor?.username === user?.username) return null;
    return myScores.get(normTitle(work.title)) ?? null;
  };

  const load = useCallback(() => {
    socialApi.getFeed().then(setItems).catch(() => setItems([]));
  }, []);

  useEffect(load, [load]);

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

  return (
    <div className="social-feed-col">
      <TakeComposer items={myItems} onPost={handlePost} onNavigate={onNavigate} />

      {items === null ? (
        <SocialEmpty text={tf.loading} />
      ) : items.length === 0 ? (
        <SocialEmpty
          icon={Rss}
          title={tf.emptyTitle}
          text={tf.emptyText}
          actionLabel={tf.emptyCta}
          onAction={onGoPeople}
        />
      ) : (
        items.map((item) => (
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
