import { useEffect, useState } from 'react';
import { updateMe, getMe } from '../../services/userService';
import { useLanguage } from '../../shared/i18n';
import Avatar from '../../shared/components/Avatar';

/**
 * Foto de perfil por URL. O usuário cola o link direto de uma imagem (https);
 * o valor vai pra users.avatar_url via PUT /users/me.
 */
export default function AvatarUrlModal({ currentUser, onClose, onDone }) {
  const { t } = useLanguage();
  const tp = t.profile;

  const [url, setUrl] = useState(currentUser?.avatarUrl || '');
  const [preview, setPreview] = useState(currentUser?.avatarUrl || '');
  const [previewFailed, setPreviewFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  // preview com debounce
  useEffect(() => {
    const v = url.trim();
    setPreviewFailed(false);
    const id = setTimeout(() => setPreview(v), 400);
    return () => clearTimeout(id);
  }, [url]);

  const trimmed = url.trim();
  const looksValid = trimmed === '' || trimmed.startsWith('https://');

  const save = async (value) => {
    setBusy(true);
    setError('');
    try {
      await updateMe({ avatarUrl: value });
      const fresh = await getMe();
      onDone(fresh);
    } catch (err) {
      setError(err?.response?.data?.message || tp.photoSaveError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={() => !busy && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 320,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        role="dialog" aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem',
          background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
          borderRadius: 12, boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
        }}
      >
        <div className="mr-flex mr-items-center mr-justify-between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{tp.photoUrlTitle}</h2>
          <button className="mr-btn mr-btn-ghost mr-btn-sm" onClick={onClose} disabled={busy}>✕</button>
        </div>

        <div className="mr-flex" style={{ gap: 16, alignItems: 'center', marginBottom: 14 }}>
          <div className="mr-avatar-lg" style={{ width: 96, height: 96, flexShrink: 0, border: '2px solid var(--mr-border)' }}>
            {preview && !previewFailed ? (
              <img
                src={preview}
                alt=""
                className="mr-avatar-img"
                onError={() => setPreviewFailed(true)}
                onLoad={() => setPreviewFailed(false)}
              />
            ) : (
              <Avatar user={currentUser} className="mr-avatar-lg" />
            )}
          </div>
          {preview && previewFailed && (
            <div style={{ fontSize: '0.78rem', color: '#ff8d8b', lineHeight: 1.5 }}>
              {tp.photoUrlBadPreview}
            </div>
          )}
        </div>

        <label className="mr-setting-label" style={{ marginBottom: 6, display: 'block' }}>
          {tp.photoUrlLabel}
        </label>
        <input
          className="mr-input"
          type="url"
          value={url}
          placeholder={tp.photoUrlPlaceholder}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: '100%' }}
          autoFocus
        />
        {!looksValid && (
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#ff8d8b' }}>
            {tp.photoUrlMustHttps}
          </p>
        )}
        <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--mr-text-secondary)', lineHeight: 1.5 }}>
          {tp.photoUrlHint}
        </p>

        {error && <p className="auth-error" style={{ marginTop: 10 }}>{error}</p>}

        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'space-between', marginTop: 18 }}>
          <button
            className="mr-btn mr-btn-outline mr-btn-sm"
            onClick={() => save('')}
            disabled={busy || !currentUser?.avatarUrl}
            type="button"
            style={{ color: '#ff8d8b', borderColor: 'rgba(226,75,74,0.45)' }}
          >
            {tp.removePhoto}
          </button>
          <div className="mr-flex mr-gap-2">
            <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose} disabled={busy} type="button">
              {tp.cancel}
            </button>
            <button
              className="mr-btn mr-btn-gold mr-btn-sm"
              onClick={() => save(trimmed)}
              disabled={busy || !looksValid || trimmed === (currentUser?.avatarUrl || '')}
              type="button"
            >
              {busy ? tp.saving : tp.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
