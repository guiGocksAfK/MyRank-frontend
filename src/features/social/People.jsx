import { useEffect, useState } from 'react';
import { ChevronRight, Plus, Scale, Search, Swords, Users } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import GroupIcon from '../chat/GroupIcon';
import NewGroupModal from '../chat/NewGroupModal';
import { socialApi, DEBATE_MAX_PCT } from './socialData';
import PersonRow from './PersonRow';
import SocialAvatar from './SocialAvatar';
import SocialEmpty from './SocialEmpty';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const CARDS_SHOWN = 8;
const FACES_SHOWN = 5;

/**
 * "Pessoas": pra achar gente nova. Uma coluna centralizada com a busca, quem
 * você segue numa linha fina (as fotinhas e "ver todos"), cartões de gosto
 * parecido, cartões de duelo pra debater e os grupos. Cada pessoa aparece numa
 * seção só. Com algo digitado, tudo vira o resultado da busca.
 */
export default function People({ onOpenUser, onCompare, onOpenConversation, onOpenConnections }) {
  const { t, locale } = useLanguage();
  const tp = t.social.people;
  const [following, setFollowing] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [groups, setGroups] = useState(null);
  const [debaters, setDebaters] = useState(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null); // { people, groups } da busca
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    socialApi.getFollowing().then(setFollowing).catch(() => setFollowing([]));
    // quem você já segue não é sugestão (mas quem você seguir aqui continua no cartão, como "Seguindo")
    socialApi.getSuggestions().then((l) => setSuggestions(l.filter((u) => !u.following))).catch(() => setSuggestions([]));
    socialApi.getGroups('').then(setGroups).catch(() => setGroups([]));
    socialApi.getDebaters().then(setDebaters).catch(() => setDebaters([]));
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

  const note = (n) => Number(n).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // nos cartões, quem você acabou de seguir fica "Seguindo" (clicar desfaz); na busca, vira "Comparar"
  const followButton = (u, wide = false) => (!wide && u.following ? (
    <button type="button" className="social-chip-btn" onClick={() => onCompare(u.id)}>
      <Scale size={13} strokeWidth={2} aria-hidden="true" />
      {tp.compare}
    </button>
  ) : (
    <button type="button" className={`social-chip-btn${u.requested || u.following ? '' : ' is-gold'}${wide ? ' is-wide' : ''}`}
      onClick={() => follow(u.id)}>
      {u.following ? t.social.profile.following : u.requested ? tp.requested : u.isPublic === false ? tp.request : tp.follow}
    </button>
  ));

  // cada pessoa numa seção só: quem está pra debater sai das sugestões
  const debateIds = new Set((debaters || []).map((u) => u.id));
  const notMine = (suggestions || []).filter((u) => !debateIds.has(u.id));
  const similar = notMine.filter((u) => u.matchPct > DEBATE_MAX_PCT);
  // sem ninguém parecido ainda (conta nova): mostra as sugestões normais
  const cards = suggestions === null ? null : (similar.length ? similar : notMine).slice(0, CARDS_SHOWN);

  const similarCards = (
    <section className="social-ppl-section">
      <h2 className="social-rail-title">{similar.length ? tp.similarTitle : tp.suggestions}</h2>
      {cards === null ? (
        <p className="social-rail-empty">{tp.loading}</p>
      ) : cards.length === 0 ? (
        <SocialEmpty compact icon={Users} text={tp.emptySuggestions} />
      ) : (
        <ul className="social-ppl-grid">
          {cards.map((u) => (
            <li key={u.id} className="social-ppl-card">
              <button type="button" className="social-ppl-open" onClick={() => onOpenUser(u.id)}>
                <SocialAvatar name={u.username} initials={u.initials} src={u.avatarSrc} size={56} />
                <span className="social-person-name">{u.username}</span>
                {u.matchPct != null ? (
                  <>
                    <span className="social-ppl-pct"><b>{u.matchPct}%</b> {tp.matchWord}</span>
                    <span className="social-rail-bar" aria-hidden="true"><span style={{ width: `${u.matchPct}%` }} /></span>
                    <span className="social-person-meta">{fmt(tp.inCommon, { n: u.sharedCount })}</span>
                  </>
                ) : (
                  <span className="social-person-meta">{fmt(tp.stats, { works: u.stats.works, avg: note(u.stats.avgScore) })}</span>
                )}
              </button>
              {followButton(u, true)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  // duelo: a obra em que vocês mais brigam, a sua nota contra a da pessoa
  const debateCards = debaters && debaters.length > 0 && (
    <section className="social-ppl-section">
      <h2 className="social-rail-title">{tp.debate}</h2>
      <ul className="social-ppl-grid is-duel">
        {debaters.map((u) => (
          <li key={u.id}>
            <button type="button" className="social-duel" onClick={() => onCompare(u.id)}>
              <span className="social-duel-who">
                <SocialAvatar name={u.username} initials={u.initials} src={u.avatarSrc} size={36} />
                <span className="social-person-name">{u.username}</span>
                <b className="social-clash-pct">{u.matchPct}%</b>
              </span>
              {u.fight && (
                <>
                  <span className="social-duel-work"><Swords size={14} strokeWidth={2} aria-hidden="true" />{u.fight.title}</span>
                  <span className="social-duel-score">
                    <span><small>{tp.you}</small><b>{note(u.fight.mine)}</b></span>
                    <span className="social-duel-x" aria-hidden="true">×</span>
                    <span><b>{note(u.fight.theirs)}</b><small>{u.username}</small></span>
                  </span>
                </>
              )}
              <span className="social-duel-cta">{tp.seeCompare}<ChevronRight size={14} strokeWidth={2} aria-hidden="true" /></span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );

  const groupList = (list, emptyText, withCreate = true) => (
    <section className="social-ppl-section">
      <h2 className="social-rail-title">{tp.groups}</h2>
      {list === null ? (
        <p className="social-rail-empty">{tp.loading}</p>
      ) : list.length === 0 && !withCreate ? (
        <SocialEmpty compact icon={Users} text={emptyText} />
      ) : list.length === 0 ? (
        // nenhum grupo ainda: uma faixa só, com o convite e o botão de criar
        <button type="button" className="social-ppl-create is-empty" onClick={() => setCreating(true)}>
          <span className="social-ppl-create-icon" aria-hidden="true"><Users size={18} strokeWidth={1.8} /></span>
          <span className="social-ppl-create-text">{emptyText}</span>
          <span className="social-chip-btn is-gold">
            <Plus size={13} strokeWidth={2.2} aria-hidden="true" />
            {tp.createGroup}
          </span>
        </button>
      ) : (
        <ul className="social-ppl-groups">
          {/* os seus grupos primeiro */}
          {[...list].sort((x, y) => (y.membership === 'MEMBER') - (x.membership === 'MEMBER')).map((g) => {
            const requested = g.membership === 'PENDING';
            const member = g.membership === 'MEMBER';
            return (
              <li key={g.id} className="social-ppl-group">
                <div className="social-ppl-group-top">
                  <GroupIcon name={g.name} imageUrl={g.imageUrl} className="social-group-icon is-large" />
                  <span className="social-person-text">
                    <span className="social-person-name">{g.name}</span>
                    <span className="social-person-meta">{fmt(tp.members, { n: g.memberCount })}</span>
                  </span>
                </div>
                {g.description && <p className="social-ppl-group-desc">{g.description}</p>}
                <button
                  type="button"
                  className={`social-chip-btn is-wide${requested || member ? '' : ' is-gold'}`}
                  disabled={requested}
                  onClick={() => (member ? onOpenConversation?.(g.id) : join(g))}
                >
                  {member ? tp.open : requested ? tp.requested : g.access === 'OPEN' ? tp.join : tp.requestJoin}
                </button>
              </li>
            );
          })}
          {/* o último cartão é o "Criar grupo" */}
          {withCreate && (
            <li>
              <button type="button" className="social-ppl-create" onClick={() => setCreating(true)}>
                <Plus size={18} strokeWidth={2} aria-hidden="true" />
                {tp.createGroup}
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );

  // quem você segue: só uma linha fina, a lista inteira fica no "ver todos"
  const followingStrip = following && following.length > 0 && (
    <button type="button" className="social-ppl-following" onClick={() => onOpenConnections?.('following')}>
      <span className="social-ppl-faces" aria-hidden="true">
        {following.slice(0, FACES_SHOWN).map((u) => (
          <SocialAvatar key={u.id} name={u.username} initials={u.initials} src={u.avatarSrc} size={26} />
        ))}
      </span>
      <span>{fmt(tp.youFollow, { n: following.length })}</span>
      <span className="social-ppl-seeall">{tp.seeAll}<ChevronRight size={14} strokeWidth={2} aria-hidden="true" /></span>
    </button>
  );

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
        <>
          <section className="social-ppl-section">
            <h2 className="social-rail-title">{tp.peopleResults}</h2>
            {!results ? (
              <p className="social-rail-empty">{tp.loading}</p>
            ) : results.people.length === 0 ? (
              <SocialEmpty compact icon={Search} text={tp.noPeople} />
            ) : (
              <ul className="social-list social-conn-list">
                {results.people.map((u) => (
                  <PersonRow key={u.id} u={u} onOpen={onOpenUser}>{followButton(u)}</PersonRow>
                ))}
              </ul>
            )}
          </section>
          {groupList(results ? results.groups : null, tp.noGroups, false)}
        </>
      ) : (
        <>
          {followingStrip}
          {similarCards}
          {debateCards}
          {groupList(groups, tp.emptyGroups)}
        </>
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
