import { useEffect, useState } from 'react';
import { ArrowLeft, Scale, Search, TriangleAlert, UserPlus, Users } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import { socialApi } from './socialData';
import PersonRow from './PersonRow';
import SocialEmpty from './SocialEmpty';

// "João" acha "joao": sem acento e sem maiúscula
const plain = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// quem tem % de gosto parecido vem primeiro, do mais parecido pro menos
const byMatch = (a, b) => (b.matchPct ?? -1) - (a.matchPct ?? -1);

/**
 * Quem você segue / quem te segue, numa coluna só e centralizada: abas com o
 * número, busca pelo nome e a lista em ordem de gosto parecido. Quem você já
 * segue ganha "Comparar"; quem te segue e você não, "Seguir de volta".
 */
export default function ConnectionsView({ initialTab = 'following', onTabChange, onBack, onOpenUser, onCompare }) {
  const { t } = useLanguage();
  const tcn = t.social.connections;
  const tp = t.social.people;
  const [tab, setTab] = useState(initialTab);
  const [list, setList] = useState(null);
  const [counts, setCounts] = useState(null);
  const [query, setQuery] = useState('');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0); // "Tentar de novo" busca outra vez

  useEffect(() => {
    socialApi.getSummary().then(setCounts).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    const fn = tab === 'followers' ? socialApi.getFollowers : socialApi.getFollowing;
    fn().then((l) => { if (alive) setList([...l].sort(byMatch)); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [tab, attempt]);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  const switchTab = (id) => {
    if (id === tab) return;
    setList(null);
    setFailed(false);
    setQuery('');
    setTab(id);
    onTabChange?.(id); // o Voltar de um perfil aberto daqui volta nesta aba
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
      {u.requested ? tp.requested : u.isPublic === false ? tp.request : tcn.followBack}
    </button>
  ));

  const TABS = [
    { id: 'following', label: tcn.following, n: counts?.following },
    { id: 'followers', label: tcn.followers, n: counts?.followers },
  ];

  const q = plain(query.trim());
  const shown = list && q ? list.filter((u) => plain(u.username).includes(q)) : list;

  return (
    <div className="social-sub social-conn">
      <button type="button" className="social-back" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        {tcn.back}
      </button>

      <div className="social-conn-bar">
        <div className="social-feedbar-tabs" role="tablist">
          {TABS.map((tb) => (
            <button key={tb.id} type="button" role="tab" aria-selected={tab === tb.id}
              className={`social-feedbar-tab${tab === tb.id ? ' is-active' : ''}`} onClick={() => switchTab(tb.id)}>
              {tb.label}
              {tb.n != null && <span className="social-conn-n">{tb.n}</span>}
            </button>
          ))}
        </div>
        {list && list.length > 0 && (
          <label className="social-search social-conn-search">
            <Search size={15} strokeWidth={1.8} aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={tcn.search} aria-label={tcn.search} />
          </label>
        )}
      </div>

      {failed ? (
        <SocialEmpty role="alert" icon={TriangleAlert} text={tcn.loadError} actionLabel={tcn.retry} onAction={retry} />
      ) : list === null ? (
        <SocialEmpty text={tcn.loading} />
      ) : list.length === 0 ? (
        <SocialEmpty
          icon={tab === 'followers' ? Users : UserPlus}
          text={tab === 'followers' ? tcn.noFollowers : tcn.noFollowing}
        />
      ) : shown.length === 0 ? (
        <SocialEmpty icon={Search} text={tp.noPeople} />
      ) : (
        <>
          {!q && <p className="social-conn-hint">{tcn.sortHint}</p>}
          <ul className="social-list social-conn-list">
            {shown.map((u) => <PersonRow key={u.id} u={u} onOpen={onOpenUser}>{action(u)}</PersonRow>)}
          </ul>
        </>
      )}
    </div>
  );
}
