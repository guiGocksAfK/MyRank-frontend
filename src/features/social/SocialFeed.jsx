import { useCallback, useEffect, useState } from 'react';
import { socialApi } from './socialData';
import TakeComposer from './TakeComposer';
import ActivityCard from './ActivityCard';

export default function SocialFeed({ onOpenUser }) {
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

  return (
    <div className="mr-space-y-3">
      <TakeComposer onPost={handlePost} />

      {items === null ? (
        <div className="social-empty">Carregando feed…</div>
      ) : items.length === 0 ? (
        <div className="social-empty">
          Nada por aqui ainda. Siga gente na aba <strong>Descobrir</strong> pra encher o feed. 👀
        </div>
      ) : (
        items.map((item) => (
          <ActivityCard
            key={item.id}
            item={item}
            onReact={handleReact}
            onOpenUser={onOpenUser}
          />
        ))
      )}
    </div>
  );
}
