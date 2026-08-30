import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { useUser } from '../../shared/userContext';
import { socialApi } from '../social/socialData';
import SocialAvatar from '../social/SocialAvatar';
import {
  getMembers,
  addMembers,
  removeMember,
  setMemberRole,
  updateGroup,
  deleteConversation,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from '../../services/chatService';

const RANK = { OWNER: 0, ADMIN: 1, MOD: 2, MEMBER: 3 };
const ACCESSES = ['OPEN', 'REQUEST', 'CLOSED'];
const ASSIGNABLE = ['ADMIN', 'MOD', 'MEMBER'];

/** Gerência do grupo: foto, acesso, cargos, membros, pedidos, sair/excluir. */
export default function GroupPanel({ conversation, onClose, onChanged, onLeft }) {
  const { t } = useLanguage();
  const tc = t.chat;
  const { user } = useUser();
  const myId = user?.id ?? null;
  const myRank = RANK[conversation.myRole] ?? 3;
  const canEditGroup = ['OWNER', 'ADMIN'].includes(conversation.myRole);
  const canModerate = ['OWNER', 'ADMIN', 'MOD'].includes(conversation.myRole);
  const isOwner = conversation.myRole === 'OWNER';

  const [members, setMembers] = useState(null);
  const [requests, setRequests] = useState([]);
  const [name, setName] = useState(conversation.name || '');
  const [photo, setPhoto] = useState(conversation.imageUrl || '');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const loadMembers = useCallback(() => {
    getMembers(conversation.id).then(setMembers).catch(() => setMembers([]));
  }, [conversation.id]);

  const loadRequests = useCallback(() => {
    if (!canModerate) return;
    getJoinRequests(conversation.id).then(setRequests).catch(() => setRequests([]));
  }, [conversation.id, canModerate]);

  useEffect(() => {
    loadMembers();
    loadRequests();
  }, [loadMembers, loadRequests]);

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

  const run = async (fn, { close = false } = {}) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged?.();
      if (close) onLeft?.();
      else {
        loadMembers();
        loadRequests();
      }
    } catch (err) {
      setError(err?.response?.data?.message || tc.actionError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="chat-modal-title">{tc.groupSettings}</h3>

        {canEditGroup && (
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
                onClick={() => run(() => updateGroup(conversation.id, { name: name.trim() }))}
                disabled={busy || !name.trim() || name.trim() === conversation.name}
              >
                {tc.save}
              </button>
            </div>

            <label className="chat-modal-label">{tc.groupPhoto}</label>
            <div className="chat-rename-row">
              <input
                className="chat-input chat-modal-input"
                type="url"
                value={photo}
                placeholder="https://…/foto.jpg"
                onChange={(e) => setPhoto(e.target.value)}
              />
              <button
                className="mr-btn mr-btn-outline mr-btn-sm"
                onClick={() => run(() => updateGroup(conversation.id, { imageUrl: photo.trim() }))}
                disabled={busy || photo.trim() === (conversation.imageUrl || '')}
              >
                {tc.save}
              </button>
            </div>

            <label className="chat-modal-label">{tc.groupAccess}</label>
            <div className="chat-access-seg">
              {ACCESSES.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`chat-access-btn ${conversation.access === a ? 'active' : ''}`}
                  disabled={busy || conversation.access === a}
                  onClick={() => run(() => updateGroup(conversation.id, { access: a }))}
                >
                  {tc.access[a]}
                </button>
              ))}
            </div>
          </>
        )}

        {canModerate && requests.length > 0 && (
          <>
            <label className="chat-modal-label">
              {tc.joinRequests} ({requests.length})
            </label>
            <div className="chat-modal-results">
              {requests.map((r) => (
                <div key={r.userId} className="chat-result">
                  <SocialAvatar name={r.username} initials={initials(r.username)} src={r.avatarUrl} size={28} />
                  <span className="chat-result-name">@{r.username}</span>
                  <button
                    type="button"
                    className="chat-mini-btn"
                    onClick={() => run(() => approveJoinRequest(conversation.id, r.userId))}
                    disabled={busy}
                  >
                    {tc.approve}
                  </button>
                  <button
                    type="button"
                    className="chat-mini-btn is-ghost"
                    onClick={() => run(() => rejectJoinRequest(conversation.id, r.userId))}
                    disabled={busy}
                  >
                    {tc.reject}
                  </button>
                </div>
              ))}
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
            members.map((m) => {
              const canKick = canModerate && m.userId !== myId && myRank < RANK[m.role];
              const canSetRole = canEditGroup && m.role !== 'OWNER' && m.userId !== myId;
              return (
                <div key={m.userId} className="chat-result chat-member-row">
                  <SocialAvatar name={m.username} initials={initials(m.username)} src={m.avatarUrl} size={28} />
                  <span className="chat-result-name">
                    @{m.username}
                    <span className={`chat-role-tag role-${m.role.toLowerCase()}`}>{tc.roles[m.role]}</span>
                  </span>
                  {canSetRole && (
                    <select
                      className="chat-role-select"
                      value={m.role}
                      disabled={busy}
                      onChange={(e) => run(() => setMemberRole(conversation.id, m.userId, e.target.value))}
                    >
                      {ASSIGNABLE.map((r) => (
                        <option key={r} value={r}>{tc.roles[r]}</option>
                      ))}
                    </select>
                  )}
                  {canKick && (
                    <button
                      type="button"
                      className="chat-remove-btn"
                      onClick={() => run(() => removeMember(conversation.id, m.userId))}
                      disabled={busy}
                    >
                      {tc.kick}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {canEditGroup && (
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
                    onClick={() =>
                      run(async () => {
                        await addMembers(conversation.id, [u.id]);
                        setQuery('');
                        setResults([]);
                      })
                    }
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
