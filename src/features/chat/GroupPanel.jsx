import { useCallback, useEffect, useMemo, useState } from 'react';
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
  getInviteToken,
  rotateInviteToken,
  revokeInviteToken,
  inviteUrl,
} from '../../services/chatService';

const RANK = { OWNER: 0, ADMIN: 1, MOD: 2, MEMBER: 3 };
const ACCESSES = ['OPEN', 'REQUEST', 'CLOSED'];
const ASSIGNABLE = ['ADMIN', 'MOD', 'MEMBER'];

/** Gerência do grupo: identidade, acesso, membros, pedidos, zona de perigo. */
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
  const [desc, setDesc] = useState(conversation.description || '');
  const [photo, setPhoto] = useState(conversation.imageUrl || '');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [inviteToken, setInviteToken] = useState(null);
  const [copied, setCopied] = useState(false);

  // Modal de verdade: trava o scroll do fundo e fecha só no X / Esc.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
    if (!canEditGroup) return;
    getInviteToken(conversation.id).then(setInviteToken).catch(() => {});
  }, [conversation.id, canEditGroup]);

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

  const copyInvite = async () => {
    if (!inviteToken) return;
    try {
      await navigator.clipboard.writeText(inviteUrl(inviteToken));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard bloqueado — o usuário copia manual do input */
    }
  };

  /** Ações imediatas (acesso, cargos, membros, pedidos, sair/excluir). */
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

  // ── Identidade: salva nome + descrição + foto num PATCH só ───────────
  const savedName = conversation.name || '';
  const savedDesc = conversation.description || '';
  const savedPhoto = conversation.imageUrl || '';
  const dirty = useMemo(
    () =>
      canEditGroup &&
      (name.trim() !== savedName ||
        desc.trim() !== savedDesc ||
        photo.trim() !== savedPhoto),
    [canEditGroup, name, desc, photo, savedName, savedDesc, savedPhoto],
  );

  const saveIdentity = async () => {
    if (!dirty || !name.trim()) return;
    const patch = {};
    if (name.trim() !== savedName) patch.name = name.trim();
    if (desc.trim() !== savedDesc) patch.description = desc.trim();
    if (photo.trim() !== savedPhoto) patch.imageUrl = photo.trim();
    setBusy(true);
    setError(null);
    try {
      await updateGroup(conversation.id, patch);
      setName((v) => v.trim());
      setDesc((v) => v.trim());
      setPhoto((v) => v.trim());
      onChanged?.();
    } catch (err) {
      setError(err?.response?.data?.message || tc.actionError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="gp-title">
      <div className="chat-modal chat-modal-lg">
        <div className="chat-modal-head">
          <h3 className="chat-modal-title" id="gp-title">{tc.groupSettings}</h3>
          <button type="button" className="chat-modal-x" onClick={onClose} aria-label={tc.close}>
            ✕
          </button>
        </div>

        <div className="chat-modal-body">
          {canEditGroup && (
            <section className="chat-modal-section">
              <h4 className="chat-modal-section-title">{tc.sectionIdentity}</h4>

              <label className="chat-modal-label">{tc.groupName}</label>
              <input
                className="chat-input chat-modal-input"
                type="text"
                value={name}
                maxLength={80}
                placeholder={tc.groupNamePlaceholder}
                onChange={(e) => setName(e.target.value)}
              />

              <label className="chat-modal-label">{tc.groupDescription}</label>
              <textarea
                className="chat-input chat-modal-input"
                rows={2}
                value={desc}
                maxLength={300}
                placeholder={tc.groupDescriptionPlaceholder}
                onChange={(e) => setDesc(e.target.value)}
              />

              <label className="chat-modal-label">{tc.groupPhoto}</label>
              <input
                className="chat-input chat-modal-input"
                type="url"
                value={photo}
                placeholder="https://…/foto.jpg"
                onChange={(e) => setPhoto(e.target.value)}
              />
            </section>
          )}

          {canEditGroup && (
            <section className="chat-modal-section">
              <h4 className="chat-modal-section-title">{tc.sectionAccess}</h4>

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
              <div className="chat-modal-hint">{tc.accessHint[conversation.access]}</div>

              <label className="chat-modal-label">{tc.inviteLink}</label>
              {inviteToken ? (
                <>
                  <div className="chat-rename-row">
                    <input
                      className="chat-input chat-modal-input"
                      type="text"
                      readOnly
                      value={inviteUrl(inviteToken)}
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      className="mr-btn mr-btn-outline mr-btn-sm"
                      type="button"
                      onClick={copyInvite}
                      disabled={busy}
                    >
                      {copied ? tc.inviteCopied : tc.inviteCopy}
                    </button>
                  </div>
                  <div className="chat-invite-actions">
                    <button
                      className="chat-mini-btn"
                      type="button"
                      onClick={() => run(async () => setInviteToken(await rotateInviteToken(conversation.id)))}
                      disabled={busy}
                    >
                      {tc.inviteRotate}
                    </button>
                    <button
                      className="chat-mini-btn is-ghost"
                      type="button"
                      onClick={() => run(async () => { await revokeInviteToken(conversation.id); setInviteToken(null); })}
                      disabled={busy}
                    >
                      {tc.inviteRevoke}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="mr-btn mr-btn-outline mr-btn-sm"
                  type="button"
                  onClick={() => run(async () => setInviteToken(await rotateInviteToken(conversation.id)))}
                  disabled={busy}
                >
                  {tc.inviteGenerate}
                </button>
              )}
              <div className="chat-invite-hint">{tc.inviteHint}</div>
            </section>
          )}

          {canModerate && requests.length > 0 && (
            <section className="chat-modal-section">
              <h4 className="chat-modal-section-title">
                {tc.joinRequests} ({requests.length})
              </h4>
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
            </section>
          )}

          <section className="chat-modal-section">
            <h4 className="chat-modal-section-title">
              {tc.sectionMembers} · {members?.length ?? conversation.memberCount}
            </h4>
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
          </section>

          <section className="chat-modal-section chat-modal-section-danger">
            <h4 className="chat-modal-section-title">{tc.sectionDanger}</h4>
            {isOwner ? (
              <button
                type="button"
                className="chat-danger-btn"
                onClick={() => run(() => deleteConversation(conversation.id), { close: true })}
                disabled={busy}
              >
                {tc.deleteGroup}
              </button>
            ) : (
              <button
                type="button"
                className="chat-danger-btn"
                onClick={() => run(() => removeMember(conversation.id, myId), { close: true })}
                disabled={busy}
              >
                {tc.leaveGroup}
              </button>
            )}
          </section>

          {error && <div className="chat-error">{error}</div>}
        </div>

        {canEditGroup && (
          <div className="chat-modal-foot">
            <button
              type="button"
              className="mr-btn mr-btn-gold mr-btn-sm"
              onClick={saveIdentity}
              disabled={busy || !dirty || !name.trim()}
            >
              {tc.saveChanges}
            </button>
          </div>
        )}
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
