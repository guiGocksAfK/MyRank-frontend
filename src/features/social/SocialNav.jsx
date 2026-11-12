import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import GroupIcon from '../chat/GroupIcon';
import { socialApi } from './socialData';
import YouCard from './YouCard';

const GROUPS_SHOWN = 5;

/**
 * Em cima do feed: as abas "Todos | Seguindo" (o filtro mais usado) e, à
 * direita, um menu pequeno pro tipo (tudo, takes ou avaliações).
 */
export function FeedBar({ scope, onScope, kind, onKind }) {
  const { t } = useLanguage();
  const tn = t.social.nav;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const KINDS = [['all', tn.kindAll], ['takes', tn.kindTakes], ['ratings', tn.kindRatings]];

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="social-feedbar">
      <div className="social-feedbar-tabs" role="tablist" aria-label={tn.show}>
        {[['all', tn.everyone], ['following', tn.followingTab]].map(([id, text]) => (
          <button key={id} type="button" role="tab" aria-selected={scope === id}
            className={`social-feedbar-tab${scope === id ? ' is-active' : ''}`} onClick={() => onScope(id)}>
            {text}
          </button>
        ))}
      </div>
      <div className="social-take-menu" ref={ref}>
        <button type="button" className="social-feedbar-kind" aria-haspopup="menu" aria-expanded={open}
          onClick={() => setOpen((v) => !v)}>
          {kind === 'all' ? tn.kind : KINDS.find(([id]) => id === kind)[1]}
          <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
        </button>
        {open && (
          <div className="social-take-menu-list" role="menu">
            {KINDS.map(([id, text]) => (
              <button key={id} type="button" role="menuitemradio" aria-checked={kind === id}
                className={kind === id ? 'is-on' : ''} onClick={() => { onKind(id); setOpen(false); }}>
                {text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Coluna da esquerda do Feed (só em tela grande): você e os seus grupos, sem
 * caixa em volta, pra não competir com o feed.
 */
export default function SocialNav({ onOpenUser, onOpenConnections, onGoPeople, onOpenGroup, refreshKey }) {
  const { t } = useLanguage();
  const tn = t.social.nav;
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    let alive = true;
    socialApi.getMyGroups()
      .then((list) => { if (alive) setGroups(list); })
      .catch(() => { if (alive) setGroups([]); });
    return () => { alive = false; };
  }, []);

  return (
    <nav className="social-nav" aria-label={tn.label}>
      <YouCard bare onOpenUser={onOpenUser} onOpenConnections={onOpenConnections} refreshKey={refreshKey} />

      <section className="social-nav-section">
        <h2 className="social-rail-title">{tn.groups}</h2>
        {groups === null ? null : groups.length === 0 ? (
          <p className="social-rail-empty">{tn.noGroups}</p>
        ) : (
          <ul className="social-rail-list">
            {groups.slice(0, GROUPS_SHOWN).map((g) => (
              <li key={g.id}>
                <button type="button" className="social-nav-link" onClick={() => onOpenGroup(g.id)}>
                  <GroupIcon name={g.name} imageUrl={g.imageUrl} className="social-group-icon is-small" />
                  <span className="social-pick-title">{g.name}</span>
                  {g.unread > 0 && <span className="social-tab-badge">{g.unread > 9 ? '9+' : g.unread}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="social-rail-more" onClick={onGoPeople}>{tn.findGroups}</button>
      </section>
    </nav>
  );
}
