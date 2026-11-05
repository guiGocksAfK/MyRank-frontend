import { useEffect, useState } from 'react';
import { updateMe } from '../../services/userService';
import Modal from '../../shared/components/Modal';
import Avatar from '../../shared/components/Avatar';
import { useLanguage } from '../../shared/i18n';

/**
 * Editar perfil: foto (link https), nome de usuário e bio, num PUT /users/me só.
 * A prévia da foto segue o link digitado, com uma pausa pra não piscar a cada tecla.
 */
export default function EditProfileModal({ profile, onClose, onSaved }) {
  const { t } = useLanguage();
  const tp = t.profile;
  const [photo, setPhoto] = useState(profile.avatarUrl || '');
  const [preview, setPreview] = useState(profile.avatarUrl || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setPreview(photo.trim()), 400);
    return () => clearTimeout(id);
  }, [photo]);

  const photoOk = photo.trim() === '' || photo.trim().startsWith('https://');

  async function handleSave() {
    if (!photoOk) { setError(tp.photoUrlMustHttps); return; }
    setSaving(true);
    setError('');
    try {
      const updated = await updateMe({
        username: username.trim() || profile.username,
        bio: bio.trim(),
        avatarUrl: photo.trim(),
      });
      onSaved(updated);
    } catch (err) {
      setError(err?.response?.data?.message || tp.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={tp.editProfile}
      onClose={onClose}
      busy={saving}
      width={460}
      closeOnBackdrop={false}
      footer={(
        <>
          {error && <p className="pf-form-error" role="alert">{error}</p>}
          <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose} disabled={saving}>{tp.cancel}</button>
          <button type="button" className="mr-btn mr-btn-gold" onClick={handleSave} disabled={saving}>
            {saving ? tp.saving : tp.save}
          </button>
        </>
      )}
    >
      <div className="pf-edit-head">
        <Avatar user={{ ...profile, username: username || profile.username, avatarUrl: preview || null }} className="mr-avatar-lg pf-avatar-md" />
        <strong>{username || profile.username}</strong>
      </div>

      <label className="pf-field">
        <span className="mr-field-label">{tp.photo}</span>
        <input className="mr-input" type="url" value={photo} placeholder={tp.photoUrlPlaceholder}
          onChange={(e) => setPhoto(e.target.value)} />
        <span className="mr-field-hint">
          {photoOk ? tp.photoUrlHint : tp.photoUrlMustHttps}
          {photo && (
            <>
              {' '}
              <button type="button" className="pf-link" onClick={() => setPhoto('')}>{tp.removePhoto}</button>
            </>
          )}
        </span>
      </label>

      <label className="pf-field">
        <span className="mr-field-label">{tp.usernameLabel}</span>
        <input className="mr-input" value={username} maxLength={50} onChange={(e) => setUsername(e.target.value)} />
      </label>

      <label className="pf-field">
        <span className="mr-field-label">{tp.bioLabel}</span>
        <textarea className="mr-input pf-textarea" rows={3} maxLength={500} value={bio}
          placeholder={tp.bioPlaceholder} onChange={(e) => setBio(e.target.value)} />
      </label>
    </Modal>
  );
}
