import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import GroupIcon from './GroupIcon';
import { getDirectory, joinGroup, cancelJoinRequest } from '../../services/chatService';

/** Diretório de grupos: busca grupos Abertos / Por convite e entra/pede pra entrar. */
export default function GroupDirectory({ onBack, onOpen }) {
  const { t } = useLanguage();
  const tc = t.chat;

  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async (q) => {
    try {
      setEntries(await getDirectory(q));
      setError(null);
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => load(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query, load]);

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

  return (
    <div className="chat-directory">
      <div className="chat-directory-head">
        <button type="button" className="chat-back is-always" onClick={onBack} aria-label={tc.back}>
          ←
        </button>
        <span>{tc.discoverGroups}</span>
      </div>

      <input
        className="chat-input chat-directory-search"
        type="text"
        value={query}
        placeholder={tc.searchGroups}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-directory-list">
        {entries === null ? (
          <div className="chat-hint">{tc.loading}</div>
        ) : entries.length === 0 ? (
          <div className="chat-hint">{tc.noGroups}</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="chat-dir-entry">
              <GroupIcon name={e.name} imageUrl={e.imageUrl} className="chat-conv-avatar" />
              <div className="chat-conv-main">
                <div className="chat-conv-name">👥 {e.name}</div>
                <div className="chat-conv-preview">
                  {tc.memberCount.replace('{n}', e.memberCount)} · {tc.access[e.access]}
                </div>
              </div>
              {e.membership === 'MEMBER' ? (
                <button type="button" className="chat-mini-btn" onClick={() => onOpen(e.id)}>
                  {tc.open}
                </button>
              ) : e.membership === 'PENDING' ? (
                <button
                  type="button"
                  className="chat-mini-btn is-ghost"
                  onClick={() => cancel(e)}
                  disabled={busyId === e.id}
                >
                  {tc.pendingCancel}
                </button>
              ) : (
                <button
                  type="button"
                  className="chat-mini-btn"
                  onClick={() => join(e)}
                  disabled={busyId === e.id}
                >
                  {e.access === 'OPEN' ? tc.join : tc.requestJoin}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
