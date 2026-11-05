import { useEffect, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { updateMe } from '../../services/userService';
import Modal from '../../shared/components/Modal';
import Avatar from '../../shared/components/Avatar';
import { useLanguage } from '../../shared/i18n';

const USERNAME_MAX = 50;
const BIO_MAX = 500;

/**
 * Editar perfil: foto (link https), nome de usuário e bio, num PUT /users/me só.
 * O campo do link só abre quando a pessoa quer trocar a foto, e diz na hora se
 * o link abriu uma imagem. "Salvar" só acende quando algo mudou.
 */
export default function EditProfileModal({ profile, onClose, onSaved }) {
  const { t } = useLanguage();
  const tp = t.profile;
  const [photo, setPhoto] = useState(profile.avatarUrl || '');
  const [urlOpen, setUrlOpen] = useState(false);
  const [check, setCheck] = useState({ url: profile.avatarUrl || '', status: 'ok' }); // status: ok | bad | loading
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState({ field: null, text: '' });

  const url = photo.trim();
  const https = url === '' || url.startsWith('https://');

  // testa o link (com uma pausa pra não testar a cada tecla) e guarda se abriu
  useEffect(() => {
    if (!url || !https) return undefined;
    let alive = true;
    const id = setTimeout(() => {
      setCheck({ url, status: 'loading' });
      const img = new Image();
      img.onload = () => alive && setCheck({ url, status: 'ok' });
      img.onerror = () => alive && setCheck({ url, status: 'bad' });
      img.src = url;
    }, 400);
    return () => { alive = false; clearTimeout(id); };
  }, [url, https]);

  const status = !url ? 'empty' : !https ? 'https' : check.url === url ? check.status : 'loading';
  const photoReady = status === 'empty' || status === 'ok';
  const name = username.trim();
  const dirty = url !== (profile.avatarUrl || '')
    || name !== profile.username
    || bio.trim() !== (profile.bio || '');
  const canSave = dirty && photoReady && name.length >= 3 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError({ field: null, text: '' });
    try {
      onSaved(await updateMe({ username: name, bio: bio.trim(), avatarUrl: url }));
    } catch (err) {
      const text = err?.response?.data?.message || tp.saveError;
      // erro do nome (em uso, tamanho) aparece embaixo do próprio campo
      setError({ field: /username|usu[aá]rio/i.test(text) ? 'username' : null, text });
    } finally {
      setSaving(false);
    }
  }

  const removePhoto = () => {
    setPhoto('');
    setUrlOpen(false);
  };

  // a prévia só usa o link novo quando ele abriu; senão fica nas iniciais
  const previewUrl = status === 'ok' ? url : null;

  return (
    <Modal
      title={tp.editProfile}
      onClose={onClose}
      busy={saving}
      width={460}
      closeOnBackdrop={false}
      footer={(
        <>
          {error.text && !error.field && <p className="pf-form-error" role="alert">{error.text}</p>}
          <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose} disabled={saving}>{tp.cancel}</button>
          <button type="button" className="mr-btn mr-btn-gold" onClick={handleSave} disabled={!canSave}>
            {saving ? tp.saving : tp.save}
          </button>
        </>
      )}
    >
      <div className="pf-photo">
        <button type="button" className="pf-photo-btn" onClick={() => setUrlOpen(true)} aria-label={tp.changePhoto}>
          <Avatar user={{ ...profile, username: name || profile.username, avatarUrl: previewUrl }} className="mr-avatar-lg pf-avatar-md" />
          <span className="pf-photo-edit" aria-hidden="true"><Pencil size={18} strokeWidth={2} /></span>
        </button>
        <div className="pf-photo-actions">
          <button type="button" className="mr-btn mr-btn-sm mr-btn-outline" onClick={() => setUrlOpen(true)}>
            {tp.changePhoto}
          </button>
          {url && (
            <button type="button" className="mr-btn mr-btn-sm mr-btn-danger-text" onClick={removePhoto}>
              {tp.removePhoto}
            </button>
          )}
        </div>
      </div>

      {urlOpen && (
        <div className="pf-field">
          <input className="mr-input" type="url" value={photo} placeholder={tp.photoUrlPlaceholder} autoFocus
            aria-label={tp.photoUrlPlaceholder} onChange={(e) => setPhoto(e.target.value)} />
          {status !== 'empty' && (
            <p className={`pf-photo-status is-${status}`} role="status">
              {status === 'ok' && <Check size={14} strokeWidth={2.4} aria-hidden="true" />}
              {(status === 'bad' || status === 'https') && <X size={14} strokeWidth={2.4} aria-hidden="true" />}
              {status === 'ok' ? tp.photoOk : status === 'bad' ? tp.photoBad : status === 'https' ? tp.photoUrlMustHttps : tp.photoChecking}
            </p>
          )}
        </div>
      )}

      <label className="pf-field">
        <span className="mr-field-label">{tp.usernameLabel}</span>
        <span className="pf-prefixed">
          <span aria-hidden="true">@</span>
          <input className="mr-input" value={username} maxLength={USERNAME_MAX}
            aria-invalid={error.field === 'username' || undefined}
            onChange={(e) => { setUsername(e.target.value); if (error.field) setError({ field: null, text: '' }); }} />
        </span>
        <span className="pf-field-foot">
          <span className="pf-field-error" role="alert">
            {error.field === 'username' ? error.text : name.length > 0 && name.length < 3 ? tp.usernameShort : ''}
          </span>
          <span className="pf-count">{username.length}/{USERNAME_MAX}</span>
        </span>
      </label>

      <label className="pf-field">
        <span className="mr-field-label">{tp.bioLabel}</span>
        <textarea className="mr-input pf-textarea" rows={3} maxLength={BIO_MAX} value={bio}
          placeholder={tp.bioPlaceholder} onChange={(e) => setBio(e.target.value)} />
        <span className="pf-field-foot">
          <span />
          <span className="pf-count">{bio.length}/{BIO_MAX}</span>
        </span>
      </label>
    </Modal>
  );
}
