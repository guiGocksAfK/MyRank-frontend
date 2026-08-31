import { useCallback, useEffect, useState } from 'react';
import { socialApi } from './socialData';
import { useLanguage } from '../../shared/i18n';
import TakeComposer from './TakeComposer';
import ActivityCard from './ActivityCard';
import SocialEmpty from './SocialEmpty';

export default function SocialFeed({ onOpenUser, onNavigate, onGoDiscover }) {
  const { t } = useLanguage();
  const tf = t.social.feed;
  const [items, setItems] = useState(null);

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
      <TakeComposer onPost={handlePost} onNavigate={onNavigate} />

      {items === null ? (
        <SocialEmpty icon="⏳" text={tf.loading} />
      ) : items.length === 0 ? (
        <SocialEmpty
          icon="🌱"
          title={tf.emptyTitle}
          text={tf.emptyText}
          actionLabel={tf.emptyCta}
          onAction={onGoDiscover}
        />
      ) : (
        items.map((item) => (
          <ActivityCard
            key={item.id}
            item={item}
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
