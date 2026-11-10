import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { socialApi } from '../social/socialData';
import { createGroup } from '../../services/chatService';
import SocialAvatar from '../social/SocialAvatar';
import ImagePreview from './ImagePreview';
import useModalBehavior from '../../shared/components/useModalBehavior';

const NAME_MAX = 80;
const DESC_MAX = 300;
const ACCESSES = ['OPEN', 'REQUEST', 'CLOSED'];

/** Cria um grupo: nome, foto (URL), acesso e (opcional) participantes. */
export default function NewGroupModal({ onClose, onCreated }) {
  const { t } = useLanguage();
  const tc = t.chat;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [access, setAccess] = useState('REQUEST');
  const [query, setQuery] = useState('');
  const [found, setFound] = useState([]);
  // busca curta demais não mostra nada (sem precisar limpar o estado)
  const results = query.trim().length < 2 ? [] : found;
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const dialog = useRef(null);
  useModalBehavior(dialog, () => { if (!busy) onClose(); });

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return undefined;
    let active = true;
    const id = setTimeout(() => {
      // só quem se segue mutuamente entra direto; o resto vem pelo link de convite (o back confere)
      socialApi.searchUsers(q).then((r) => active && setFound(r.filter((u) => u.following && u.followsYou))).catch(() => {});
    }, 250);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [query]);

  const isSelected = (id) => selected.some((u) => u.id === id);
  const toggle = (user) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const canCreate = name.trim().length > 0 && !busy;

  const handleCreate = async () => {
    if (!canCreate) return;
    setBusy(true);
    setError(null);
    try {
      const conv = await createGroup({
        name: name.trim(),
        memberIds: selected.map((u) => u.id),
        access,
        imageUrl: imageUrl.trim(),
        description: description.trim(),
      });
      onCreated(conv);
    } catch (err) {
      setError(err?.response?.data?.message || tc.createError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={() => !busy && onClose()}>
      <div
        ref={dialog}
        className="chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ng-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="chat-modal-title" id="ng-title">{tc.newGroupTitle}</h3>

        <label className="chat-modal-label">{tc.groupName}</label>
        <input
          className="chat-input chat-modal-input"
          type="text"
          value={name}
          maxLength={NAME_MAX}
          placeholder={tc.groupNamePlaceholder}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="chat-modal-label">{tc.groupDescriptionOptional}</label>
        <textarea
          className="chat-input chat-modal-input"
          rows={2}
          value={description}
          maxLength={DESC_MAX}
          placeholder={tc.groupDescriptionPlaceholder}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="chat-modal-label">{tc.groupPhotoOptional}</label>
        <input
          className="chat-input chat-modal-input"
          type="url"
          value={imageUrl}
          placeholder="https://…/foto.jpg"
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <ImagePreview url={imageUrl} />

        <label className="chat-modal-label">{tc.groupAccess}</label>
        <div className="chat-access-seg">
          {ACCESSES.map((a) => (
            <button
              key={a}
              type="button"
              className={`chat-access-btn ${access === a ? 'active' : ''}`}
              onClick={() => setAccess(a)}
            >
              {tc.access[a]}
            </button>
          ))}
        </div>
        <div className="chat-modal-hint">{tc.accessHint[access]}</div>

        <label className="chat-modal-label">{tc.addPeopleOptional}</label>
        {selected.length > 0 && (
          <div className="chat-chips">
            {selected.map((u) => (
              <button key={u.id} type="button" className="chat-chip" onClick={() => toggle(u)}>
                {u.username} ✕
              </button>
            ))}
          </div>
        )}
        <input
          className="chat-input chat-modal-input"
          type="text"
          value={query}
          placeholder={tc.searchUser}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="chat-modal-results">
          {query.trim().length >= 2 && results.length === 0 && (
            <div className="chat-hint">{tc.noMutuals}</div>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              className={`chat-result ${isSelected(u.id) ? 'is-selected' : ''}`}
              onClick={() => toggle(u)}
            >
              <SocialAvatar name={u.username} initials={u.initials} color={u.color} src={u.avatarSrc} size={28} />
              <span className="chat-result-name">@{u.username}</span>
              {isSelected(u.id) && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>

        {error && <div className="chat-error">{error}</div>}

        <div className="chat-modal-actions mr-actions">
          <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose} disabled={busy}>
            {tc.cancel}
          </button>
          <button type="button" className="mr-btn mr-btn-gold" onClick={handleCreate} disabled={!canCreate}>
            {busy ? tc.creating : tc.create}
          </button>
        </div>
      </div>
    </div>
  );
}
