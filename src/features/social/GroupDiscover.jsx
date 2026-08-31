import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import GroupIcon from '../chat/GroupIcon';
import NewGroupModal from '../chat/NewGroupModal';
import { getDirectory, joinGroup, cancelJoinRequest } from '../../services/chatService';

const PAGE = 30;

/**
 * Descoberta de grupos — trilho direito da aba "Descobrir" da Social.
 * Dá destaque aos grupos (antes escondidos dentro de Mensagens).
 */
export default function GroupDiscover({ onOpenConversation }) {
  const { t } = useLanguage();
  const tc = t.chat;
  const tg = t.social.groups;

  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async (q) => {
    const mine = ++seq.current;
    try {
      const rows = await getDirectory(q, 0);
      if (mine !== seq.current) return;
      setEntries(rows);
      setPage(0);
      setHasMore(rows.length === PAGE);
      setError(null);
    } catch (err) {
      if (mine !== seq.current) return;
      setEntries([]);
      setError(err?.response?.data?.message || tc.actionError);
    }
  }, [tc.actionError]);

  useEffect(() => {
    const id = setTimeout(() => load(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query, load]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const rows = await getDirectory(query.trim(), next);
      setEntries((prev) => [...(prev || []), ...rows]);
      setPage(next);
      setHasMore(rows.length === PAGE);
    } catch {
      /* silencioso */
    } finally {
      setLoadingMore(false);
    }
  };

  const act = async (entry, fn) => {
    setBusyId(entry.id);
    setError(null);
    try {
      await fn();
      await load(query.trim());
    } catch (err) {
      setError(err?.response?.data?.message || tc.actionError);
    } finally {
      setBusyId(null);
    }
  };

  const join = (entry) =>
    act(entry, async () => {
      const state = await joinGroup(entry.id);
      if (state === 'JOINED') onOpenConversation?.(entry.id);
    });

  const cancel = (entry) => act(entry, () => cancelJoinRequest(entry.id));

  const cta = (e) => {
    if (e.membership === 'MEMBER') {
      return (
        <button
          type="button"
          className="mr-btn mr-btn-outline mr-btn-sm"
          onClick={() => onOpenConversation?.(e.id)}
        >
          {tc.open}
        </button>
      );
    }
    if (e.membership === 'PENDING') {
      return (
        <button
          type="button"
          className="mr-btn mr-btn-outline mr-btn-sm"
          onClick={() => cancel(e)}
          disabled={busyId === e.id}
        >
          {tc.pendingCancel}
        </button>
      );
    }
    return (
      <button
        type="button"
        className="mr-btn mr-btn-gold mr-btn-sm"
        onClick={() => join(e)}
        disabled={busyId === e.id}
      >
        {e.access === 'OPEN' ? tc.join : tc.requestJoin}
      </button>
    );
  };

  return (
    <aside className="social-groupdisc">
      <div className="social-groupdisc-head">
        <div>
          <div className="social-groupdisc-title">{tg.title}</div>
          <div className="social-groupdisc-sub">{tg.subtitle}</div>
        </div>
        <button
          type="button"
          className="social-groupdisc-new"
          onClick={() => setShowNew(true)}
        >
          ＋ {tg.create}
        </button>
      </div>

      <div className="social-groupdisc-searchwrap">
        <span aria-hidden="true">🔍</span>
        <input
          className="social-groupdisc-search"
          type="text"
          value={query}
          placeholder={tc.searchGroups}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="social-groupdisc-error">{error}</div>}

      <div className="social-groupdisc-body">
        {entries === null ? (
          <div className="social-groupdisc-hint">{tc.loading}</div>
        ) : entries.length === 0 ? (
          <div className="social-groupdisc-empty">
            <span aria-hidden="true">🫥</span>
            <p>{tc.noGroups}</p>
          </div>
        ) : (
          <>
            <ul className="social-groupdisc-list">
              {entries.map((e) => (
                <li key={e.id} className="social-groupdisc-card">
                  <GroupIcon name={e.name} imageUrl={e.imageUrl} className="social-groupdisc-photo" />
                  <div className="social-groupdisc-info">
                    <div className="social-groupdisc-name">{e.name}</div>
                    <div className="social-groupdisc-meta">
                      {tc.memberCount.replace('{n}', e.memberCount)}
                      <span className={`social-groupdisc-access is-${e.access.toLowerCase()}`}>
                        {tc.access[e.access]}
                      </span>
                    </div>
                    {e.description && <p className="social-groupdisc-desc">{e.description}</p>}
                    <div className="social-groupdisc-cta">{cta(e)}</div>
                  </div>
                </li>
              ))}
            </ul>
            {hasMore && (
              <button
                type="button"
                className="social-groupdisc-more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? tc.loadingMore : tc.loadMore}
              </button>
            )}
          </>
        )}
      </div>

      {showNew && (
        <NewGroupModal
          onClose={() => setShowNew(false)}
          onCreated={(conv) => {
            setShowNew(false);
            onOpenConversation?.(conv.id);
          }}
        />
      )}
    </aside>
  );
}
