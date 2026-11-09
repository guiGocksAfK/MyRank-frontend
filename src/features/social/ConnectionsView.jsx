import { useEffect, useState } from 'react';
import { ArrowLeft, Scale, UserPlus, Users } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import { socialApi } from './socialData';
import PersonRow from './PersonRow';
import SocialEmpty from './SocialEmpty';

/**
 * Quem você segue / quem te segue. Mesma linha de pessoa da aba Pessoas: quem
 * você já segue ganha "Comparar"; quem te segue e você não, "Seguir".
 */
export default function ConnectionsView({ initialTab = 'following', onBack, onOpenUser, onCompare }) {
  const { t } = useLanguage();
  const tcn = t.social.connections;
  const tp = t.social.people;
  const [tab, setTab] = useState(initialTab);
  const [list, setList] = useState(null);

  useEffect(() => {
    let alive = true;
    const fn = tab === 'followers' ? socialApi.getFollowers : socialApi.getFollowing;
    fn().then((l) => { if (alive) setList(l); }).catch(() => { if (alive) setList([]); });
    return () => { alive = false; };
  }, [tab]);

  const switchTab = (id) => {
    if (id === tab) return;
    setList(null);
    setTab(id);
  };

  const follow = async (id) => {
    try {
      const u = await socialApi.toggleFollow(id);
      setList((l) => l?.map((x) => (x.id === id ? { ...x, following: u.following, requested: u.requested } : x)));
    } catch {
      /* silencioso */
    }
  };

  const action = (u) => (u.following ? (
    <button type="button" className="social-chip-btn" onClick={() => onCompare?.(u.id)}>
      <Scale size={13} strokeWidth={2} aria-hidden="true" />
      {tp.compare}
    </button>
  ) : (
    <button type="button" className={`social-chip-btn${u.requested ? '' : ' is-gold'}`} onClick={() => follow(u.id)}>
      {u.requested ? tp.requested : u.isPublic === false ? tp.request : tp.follow}
    </button>
  ));

  const TABS = [
    { id: 'following', label: tcn.following },
    { id: 'followers', label: tcn.followers },
  ];

  return (
    <div className="social-sub">
      <button type="button" className="social-back" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        {tcn.back}
      </button>

      <div className="rk-tabs" role="tablist">
        <div className="rk-tabs-scroll">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={tab === tb.id}
              className={`rk-tab${tab === tb.id ? ' is-active' : ''}`}
              onClick={() => switchTab(tb.id)}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {list === null ? (
        <SocialEmpty text={tcn.loading} />
      ) : list.length === 0 ? (
        <SocialEmpty
          icon={tab === 'followers' ? Users : UserPlus}
          text={tab === 'followers' ? tcn.noFollowers : tcn.noFollowing}
        />
      ) : (
        <section className="mr-panel social-col social-connections">
          <ul className="social-list">
            {list.map((u) => <PersonRow key={u.id} u={u} onOpen={onOpenUser}>{action(u)}</PersonRow>)}
          </ul>
        </section>
      )}
    </div>
  );
}
