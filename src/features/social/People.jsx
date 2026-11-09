import { useEffect, useState } from 'react';
import { Plus, Scale, Search, UserPlus, Users } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import GroupIcon from '../chat/GroupIcon';
import NewGroupModal from '../chat/NewGroupModal';
import { socialApi } from './socialData';
import SocialAvatar from './SocialAvatar';
import SocialEmpty from './SocialEmpty';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const avg = (n, locale) => Number(n || 0).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Pessoa: foto, nome e, embaixo, o gosto parecido com o seu (com 3+ obras em
 * comum) ou as obras e a média; a ação (Comparar / Seguir) à direita.
 */
function PersonRow({ u, onOpen, children }) {
  const { t, locale } = useLanguage();
  return (
    <li className="social-person">
      <button type="button" className="social-person-main" onClick={() => onOpen(u.id)}>
        <SocialAvatar name={u.username} initials={u.initials} src={u.avatarSrc} size={36} />
        <span className="social-person-text">
          <span className="social-person-name">{u.username}</span>
          <span className="social-person-meta">
            {u.matchPct != null ? (
              <>
                <b className="social-match">{fmt(t.social.people.match, { pct: u.matchPct })}</b>
                {' · '}
                {fmt(t.social.people.inCommon, { n: u.sharedCount })}
              </>
            ) : (
              fmt(t.social.people.stats, { works: u.stats.works, avg: avg(u.stats.avgScore, locale) })
            )}
          </span>
        </span>
      </button>
      {children}
    </li>
  );
}

function Column({ title, children }) {
  return (
    <section className="mr-panel social-col">
      <h2 className="social-rail-title">{title}</h2>
      {children}
    </section>
  );
}

/**
 * "Pessoas": uma busca só (pessoas e grupos) e três colunas iguais — quem você
 * segue (com Comparar), sugestões (com Seguir) e grupos (com Entrar e Criar).
 * Com algo digitado, as colunas viram os resultados da busca.
 */
export default function People({ onOpenUser, onCompare, onOpenConversation }) {
  const { t } = useLanguage();
  const tp = t.social.people;
  const [following, setFollowing] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [groups, setGroups] = useState(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null); // { people, groups } da busca
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    socialApi.getFollowing().then(setFollowing).catch(() => setFollowing([]));
    socialApi.getSuggestions().then(setSuggestions).catch(() => setSuggestions([]));
    socialApi.getGroups('').then(setGroups).catch(() => setGroups([]));
  }, []);

  // busca com uma pausa curta, pra não chamar a API a cada letra
  const term = q.trim();
  useEffect(() => {
    if (!term) return undefined;
    let alive = true;
    const id = setTimeout(() => {
      Promise.all([
        socialApi.searchUsers(term).catch(() => []),
        socialApi.getGroups(term).catch(() => []),
      ]).then(([people, gs]) => { if (alive) setFound({ term, people, groups: gs }); });
    }, 250);
    return () => { alive = false; clearTimeout(id); };
  }, [term]);
  const results = term && found?.term === term ? found : null;

  // seguir / deixar de seguir: atualiza a pessoa em todas as listas
  const follow = async (id) => {
    try {
      const u = await socialApi.toggleFollow(id);
      const patch = (list) => list?.map((x) => (x.id === id ? { ...x, following: u.following, requested: u.requested } : x));
      setSuggestions(patch);
      setFound((f) => f && { ...f, people: patch(f.people) });
      if (u.following) setFollowing((list) => (list?.some((x) => x.id === id) ? list : [...(list || []), u]));
    } catch {
      /* silencioso */
    }
  };

  const join = async (g) => {
    try {
      const state = await socialApi.joinGroup(g.id);
      if (state === 'JOINED') { onOpenConversation?.(g.id); return; }
      const mark = (list) => list?.map((x) => (x.id === g.id ? { ...x, membership: 'PENDING' } : x));
      setGroups(mark);
      setFound((f) => f && { ...f, groups: mark(f.groups) });
    } catch {
      /* silencioso */
    }
  };

  const personAction = (u) => (u.following ? (
    <button type="button" className="social-chip-btn" onClick={() => onCompare(u.id)}>
      <Scale size={13} strokeWidth={2} aria-hidden="true" />
      {tp.compare}
    </button>
  ) : (
    <button type="button" className={`social-chip-btn${u.requested ? '' : ' is-gold'}`} onClick={() => follow(u.id)}>
      {u.requested ? tp.requested : u.isPublic === false ? tp.request : tp.follow}
    </button>
  ));

  const peopleList = (list, emptyText, emptyIcon) => {
    if (list === null) return <p className="social-rail-empty">{tp.loading}</p>;
    if (list.length === 0) return <SocialEmpty compact icon={emptyIcon} text={emptyText} />;
    return (
      <ul className="social-list">
        {list.map((u) => <PersonRow key={u.id} u={u} onOpen={onOpenUser}>{personAction(u)}</PersonRow>)}
      </ul>
    );
  };

  const groupList = (list, emptyText) => {
    if (list === null) return <p className="social-rail-empty">{tp.loading}</p>;
    return (
      <>
        {list.length === 0 ? (
          <SocialEmpty compact icon={Users} text={emptyText} />
        ) : (
          <ul className="social-list">
            {list.map((g) => {
              const requested = g.membership === 'PENDING';
              const member = g.membership === 'MEMBER';
              return (
                <li key={g.id} className="social-person">
                  <span className="social-person-main is-static" title={g.description || undefined}>
                    <GroupIcon name={g.name} imageUrl={g.imageUrl} className="social-group-icon" />
                    <span className="social-person-text">
                      <span className="social-person-name">{g.name}</span>
                      <span className="social-person-meta">{fmt(tp.members, { n: g.memberCount })}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    className={`social-chip-btn${requested || member ? '' : ' is-gold'}`}
                    disabled={requested}
                    onClick={() => (member ? onOpenConversation?.(g.id) : join(g))}
                  >
                    {member ? tp.open : requested ? tp.requested : g.access === 'OPEN' ? tp.join : tp.requestJoin}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <button type="button" className="social-rail-more" onClick={() => setCreating(true)}>
          <Plus size={14} strokeWidth={2.2} aria-hidden="true" />
          {tp.createGroup}
        </button>
      </>
    );
  };

  return (
    <div className="social-people">
      <label className="social-search">
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <input
          type="search"
          value={q}
          placeholder={tp.searchPlaceholder}
          aria-label={tp.searchPlaceholder}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {term ? (
        <div className="social-cols is-two">
          <Column title={tp.peopleResults}>
            {peopleList(results ? results.people : null, tp.noPeople, Search)}
          </Column>
          <Column title={tp.groups}>{groupList(results ? results.groups : null, tp.noGroups)}</Column>
        </div>
      ) : (
        <div className="social-cols">
          <Column title={tp.following}>{peopleList(following, tp.emptyFollowing, UserPlus)}</Column>
          <Column title={tp.suggestions}>
            {peopleList(suggestions?.filter((u) => !u.following) ?? null, tp.emptySuggestions, Users)}
          </Column>
          <Column title={tp.groups}>{groupList(groups, tp.emptyGroups)}</Column>
        </div>
      )}

      {creating && (
        <NewGroupModal
          onClose={() => setCreating(false)}
          onCreated={(conv) => {
            setCreating(false);
            if (conv?.id) onOpenConversation?.(conv.id);
          }}
        />
      )}
    </div>
  );
}
