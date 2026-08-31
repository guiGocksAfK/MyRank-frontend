import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import GroupIcon from './GroupIcon';
import { getDirectory, joinGroup, cancelJoinRequest } from '../../services/chatService';

const PAGE = 30;

/** Diretório de grupos — grade de cards, populares primeiro. Vive dentro do .chat-main. */
export default function GroupDirectory({ onBack, onOpen }) {
  const { t } = useLanguage();
  const tc = t.chat;

  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
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
      if (state === 'JOINED') onOpen(entry.id);
    });

  const cancel = (entry) => act(entry, () => cancelJoinRequest(entry.id));

  const cta = (e) => {
    if (e.membership === 'MEMBER') {
      return (
        <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => onOpen(e.id)}>
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
    <div className="chat-directory">
      <div className="chat-directory-head">
        <button type="button" className="chat-back is-always" onClick={onBack} aria-label={tc.back}>
          ←
        </button>
        <span>{tc.discoverGroups}</span>
      </div>

      <div className="chat-directory-search-wrap">
        <input
          className="chat-input"
          type="text"
          value={query}
          placeholder={tc.searchGroups}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-directory-body">
        {entries === null ? (
          <div className="chat-hint">{tc.loading}</div>
        ) : entries.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon" aria-hidden="true">🔍</div>
            <p>{tc.noGroups}</p>
          </div>
        ) : (
          <>
            <div className="chat-dir-grid">
              {entries.map((e) => (
                <div key={e.id} className="chat-dir-card">
                  <GroupIcon name={e.name} imageUrl={e.imageUrl} className="chat-dir-card-photo" />
                  <div className="chat-dir-card-name">{e.name}</div>
                  <div className="chat-dir-card-meta">
                    {tc.memberCount.replace('{n}', e.memberCount)} · {tc.access[e.access]}
                  </div>
                  {e.description && <div className="chat-dir-card-desc">{e.description}</div>}
                  <div className="chat-dir-card-cta">{cta(e)}</div>
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                className="chat-load-more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? tc.loadingMore : tc.loadMore}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
