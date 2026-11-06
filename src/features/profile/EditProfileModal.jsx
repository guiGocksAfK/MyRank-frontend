import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Link2, Pencil, Trash2, X } from 'lucide-react';
import { updateMe } from '../../services/userService';
import Modal from '../../shared/components/Modal';
import Avatar from '../../shared/components/Avatar';
import { useLanguage } from '../../shared/i18n';
import useDismiss from '../../shared/components/useDismiss';

const USERNAME_MAX = 50;
const BIO_MAX = 500;

/**
 * Editar perfil: foto (link https), nome de usuário e bio, num PUT /users/me só.
 * Foto e nome lado a lado; a foto só se edita pelo lápis (menu: colar link ou
 * remover). O campo do link diz na hora se abriu uma imagem. Contadores só
 * aparecem com o campo em foco ou perto do limite. "Salvar" só acende quando
 * algo mudou.
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [focus, setFocus] = useState(null); // 'username' | 'bio'
  const menuBox = useRef(null);
  const menuButton = useRef(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDismiss(menuOpen, closeMenu, menuBox, menuButton);

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
    setMenuOpen(false);
  };
  const openUrl = () => {
    setUrlOpen(true);
    setMenuOpen(false);
  };
  const nameError = error.field === 'username' ? error.text : name.length > 0 && name.length < 3 ? tp.usernameShort : '';
  // contador só com o campo em foco ou a partir de 80% do limite
  const showCount = (field, length, max) => focus === field || length >= max * 0.8;

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
      <div className="pf-identity">
        <div className="pf-photo-box" ref={menuBox}>
          <Avatar user={{ ...profile, username: name || profile.username, avatarUrl: previewUrl }} className="mr-avatar-lg pf-avatar-md" />
          <button ref={menuButton} type="button" className="pf-photo-pencil" onClick={() => setMenuOpen((o) => !o)}
            aria-label={tp.changePhoto} aria-haspopup="menu" aria-expanded={menuOpen}>
            <Pencil size={13} strokeWidth={2.2} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="mr-menu pf-photo-menu" role="menu">
              <button type="button" role="menuitem" className="mr-menu-item" onClick={openUrl}>
                <Link2 size={14} strokeWidth={1.8} aria-hidden="true" />{tp.photoPasteLink}
              </button>
              {url && (
                <button type="button" role="menuitem" className="mr-menu-item pf-menu-danger" onClick={removePhoto}>
                  <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />{tp.removePhoto}
                </button>
              )}
            </div>
          )}
        </div>

        <label className="pf-field pf-identity-name">
          <span className="mr-field-label">{tp.usernameLabel}</span>
          <span className="pf-prefixed">
            <span aria-hidden="true">@</span>
            <input className="mr-input" value={username} maxLength={USERNAME_MAX}
              aria-invalid={error.field === 'username' || undefined}
              onFocus={() => setFocus('username')} onBlur={() => setFocus(null)}
              onChange={(e) => { setUsername(e.target.value); if (error.field) setError({ field: null, text: '' }); }} />
          </span>
          {(nameError || showCount('username', username.length, USERNAME_MAX)) && (
            <span className="pf-field-foot">
              <span className="pf-field-error" role="alert">{nameError}</span>
              {showCount('username', username.length, USERNAME_MAX) && <span className="pf-count">{username.length}/{USERNAME_MAX}</span>}
            </span>
          )}
        </label>
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
        <span className="mr-field-label">{tp.bioLabel}</span>
        <textarea className="mr-input pf-textarea" rows={3} maxLength={BIO_MAX} value={bio}
          placeholder={tp.bioPlaceholder} onFocus={() => setFocus('bio')} onBlur={() => setFocus(null)}
          onChange={(e) => setBio(e.target.value)} />
        {showCount('bio', bio.length, BIO_MAX) && (
          <span className="pf-field-foot">
            <span />
            <span className="pf-count">{bio.length}/{BIO_MAX}</span>
          </span>
        )}
      </label>
    </Modal>
  );
}
