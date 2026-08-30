import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { useUser } from '../../shared/userContext';
import { socialApi } from '../social/socialData';
import SocialAvatar from '../social/SocialAvatar';
import api from '../../services/api';
import {
  getMembers,
  addMembers,
  removeMember,
  renameConversation,
  deleteConversation,
} from '../../services/chatService';

/** Painel de gerência do grupo: membros, renomear, adicionar/remover, sair, excluir. */
export default function GroupPanel({ conversation, onClose, onChanged, onLeft }) {
  const { t } = useLanguage();
  const tc = t.chat;
  const { user } = useUser();
  const myId = user?.id ?? null;
  const isOwner = conversation.myRole === 'OWNER';

  const [members, setMembers] = useState(null);
  const [name, setName] = useState(conversation.name || '');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const loadMembers = useCallback(() => {
    getMembers(conversation.id).then(setMembers).catch(() => setMembers([]));
  }, [conversation.id]);

  useEffect(loadMembers, [loadMembers]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    let active = true;
    const id = setTimeout(() => {
      socialApi.searchUsers(q).then((r) => active && setResults(r)).catch(() => {});
    }, 250);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [query]);

  const memberIds = new Set((members || []).map((m) => m.userId));

  const run = async (fn, { close = false, changed = true } = {}) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (changed) onChanged?.();
      if (close) onLeft?.();
      else loadMembers();
    } catch (err) {
      setError(err?.response?.data?.message || tc.actionError);
    } finally {
      setBusy(false);
    }
  };

  const handleRename = () => {
    const next = name.trim();
    if (!next || next === conversation.name) return;
    run(() => renameConversation(conversation.id, next));
  };

  const handleAdd = (u) =>
    run(async () => {
      await addMembers(conversation.id, [u.id]);
      setQuery('');
      setResults([]);
    });

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="chat-modal-title">{tc.groupSettings}</h3>

        {isOwner && (
          <>
            <label className="chat-modal-label">{tc.groupName}</label>
            <div className="chat-rename-row">
              <input
                className="chat-input chat-modal-input"
                type="text"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                className="mr-btn mr-btn-outline mr-btn-sm"
                onClick={handleRename}
                disabled={busy || !name.trim() || name.trim() === conversation.name}
              >
                {tc.rename}
              </button>
            </div>
          </>
        )}

        <label className="chat-modal-label">
          {tc.memberCount.replace('{n}', members?.length ?? conversation.memberCount)}
        </label>
        <div className="chat-modal-results">
          {members === null ? (
            <div className="chat-hint">{tc.loading}</div>
          ) : (
            members.map((m) => (
              <div key={m.userId} className="chat-result">
                <SocialAvatar name={m.username} initials={initials(m.username)} src={avatarSrc(m)} size={28} />
                <span className="chat-result-name">
                  @{m.username}
                  {m.role === 'OWNER' && <span className="chat-role-tag">{tc.owner}</span>}
                </span>
                {isOwner && m.role !== 'OWNER' && m.userId !== myId && (
                  <button
                    type="button"
                    className="chat-remove-btn"
                    onClick={() => run(() => removeMember(conversation.id, m.userId))}
                    disabled={busy}
                  >
                    {tc.remove}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {isOwner && (
          <>
            <label className="chat-modal-label">{tc.addPeople}</label>
            <input
              className="chat-input chat-modal-input"
              type="text"
              value={query}
              placeholder={tc.searchUser}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="chat-modal-results">
              {query.trim().length >= 2 && results.filter((u) => !memberIds.has(u.id)).length === 0 && (
                <div className="chat-hint">{tc.noUsers}</div>
              )}
              {results
                .filter((u) => !memberIds.has(u.id))
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="chat-result"
                    onClick={() => handleAdd(u)}
                    disabled={busy}
                  >
                    <SocialAvatar name={u.username} initials={u.initials} color={u.color} src={u.avatarSrc} size={28} />
                    <span className="chat-result-name">@{u.username}</span>
                    <span aria-hidden="true">＋</span>
                  </button>
                ))}
            </div>
          </>
        )}

        {error && <div className="chat-error">{error}</div>}

        <div className="chat-modal-actions chat-modal-actions-split">
          <div>
            {isOwner ? (
              <button
                className="chat-danger-btn"
                onClick={() => run(() => deleteConversation(conversation.id), { close: true })}
                disabled={busy}
              >
                {tc.deleteGroup}
              </button>
            ) : (
              <button
                className="chat-danger-btn"
                onClick={() => run(() => removeMember(conversation.id, myId), { close: true })}
                disabled={busy}
              >
                {tc.leaveGroup}
              </button>
            )}
          </div>
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose} disabled={busy}>
            {tc.close}
          </button>
        </div>
      </div>
    </div>
  );
}

function initials(username) {
  return (username || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function avatarSrc(m) {
  if (m.avatarUrl) return m.avatarUrl;
  if (!m.userId) return null;
  const base = (api.defaults.baseURL || '').replace(/\/$/, '');
  return `${base}/users/${m.userId}/avatar`;
}
