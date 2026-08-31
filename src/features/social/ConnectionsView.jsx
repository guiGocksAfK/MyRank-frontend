import { useEffect, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { socialApi } from './socialData';
import UserPill from './UserPill';
import SocialEmpty from './SocialEmpty';

/** Lista de quem você segue / quem te segue, com alternância. */
export default function ConnectionsView({ initialTab = 'following', onBack, onOpenUser }) {
  const { t } = useLanguage();
  const tcn = t.social.connections;
  const [tab, setTab] = useState(initialTab);
  const [list, setList] = useState(null);

  useEffect(() => {
    setList(null);
    const fn = tab === 'followers' ? socialApi.getFollowers : socialApi.getFollowing;
    fn().then(setList).catch(() => setList([]));
  }, [tab]);

  const handleFollow = (id) => socialApi.toggleFollow(id);

  return (
    <div className="mr-space-y-4">
      <div className="mr-flex mr-items-center mr-gap-3">
        <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onBack}>{tcn.back}</button>
        <div className="social-seg">
          <button
            type="button"
            className={tab === 'following' ? 'active' : ''}
            onClick={() => setTab('following')}
          >
            {tcn.following}
          </button>
          <button
            type="button"
            className={tab === 'followers' ? 'active' : ''}
            onClick={() => setTab('followers')}
          >
            {tcn.followers}
          </button>
        </div>
      </div>

      {list === null ? (
        <SocialEmpty icon="⏳" text={tcn.loading} />
      ) : list.length === 0 ? (
        <SocialEmpty
          icon={tab === 'followers' ? '👋' : '🔍'}
          text={tab === 'followers' ? tcn.noFollowers : tcn.noFollowing}
        />
      ) : (
        <div className="mr-space-y-2">
          {list.map((u) => (
            <UserPill key={u.id} user={u} onToggleFollow={handleFollow} onOpen={onOpenUser} />
          ))}
        </div>
      )}
    </div>
  );
}
