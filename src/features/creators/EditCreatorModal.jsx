import { useState } from 'react';
import Modal from '../../shared/components/Modal';
import SelectMenu from '../../shared/components/SelectMenu';
import { useLanguage } from '../../shared/i18n';
import { updateCreatorProfile } from '../../services/creatorService';
import CreatorAvatar from './CreatorAvatar';

const TYPES = ['Diretor', 'Escritor', 'Studio', 'Criador'];

/**
 * Editar criador: a foto de cada pessoa da entrada (link próprio ou volta pra
 * automática) e o tipo (vale pra todas). Fica só pro usuário.
 */
export default function EditCreatorModal({ entry, profiles, onSaved, onClose }) {
  const { t } = useLanguage();
  const tc = t.creators;
  const te = tc.edit;
  const [photos, setPhotos] = useState(() => Object.fromEntries(entry.members.map(m => [
    m.key, profiles[m.key]?.customPhoto ? profiles[m.key].photoUrl : '',
  ])));
  const chosenTypes = entry.members.map(m => profiles[m.key]?.type ?? null);
  const [type, setType] = useState(chosenTypes.every(x => x === chosenTypes[0]) ? chosenTypes[0] : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const bad = Object.values(photos).find(url => url.trim() && !url.trim().startsWith('https://'));
    if (bad) { setError(te.httpsOnly); return; }
    setSaving(true);
    setError('');
    try {
      const kind = (type ?? entry.autoType) === 'Studio' ? 'COMPANY' : 'PERSON';
      const saved = await Promise.all(entry.members.map(m => updateCreatorProfile({
        name: m.name, photoUrl: photos[m.key].trim() || null, type, kind,
      })));
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || te.saveError);
    } finally {
      setSaving(false);
    }
  }

  // prévia: o que está digitado vale como foto própria
  const preview = Object.fromEntries(entry.members.map(m => [m.key, photos[m.key].trim()
    ? { photoUrl: photos[m.key].trim(), customPhoto: true }
    : { ...profiles[m.key], photoUrl: profiles[m.key]?.customPhoto ? null : profiles[m.key]?.photoUrl, customPhoto: false }]));

  return (
    <Modal
      title={te.title}
      onClose={onClose}
      busy={saving}
      width={460}
      closeOnBackdrop={false}
      footer={(
        <>
          {error && <p className="cr-edit-error" role="alert">{error}</p>}
          <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose} disabled={saving}>{te.cancel}</button>
          <button type="button" className="mr-btn mr-btn-gold" onClick={handleSave} disabled={saving}>
            {saving ? te.saving : te.save}
          </button>
        </>
      )}
    >
      <div className="cr-edit-head">
        <CreatorAvatar entry={entry} profiles={preview} isCompany={(type ?? entry.autoType) === 'Studio'} size="lg" />
        <strong>{entry.name}</strong>
      </div>

      {entry.members.map(member => (
        <label key={member.key} className="cr-edit-field">
          <span className="mr-field-label">{entry.members.length > 1 ? `${te.photo} · ${member.name}` : te.photo}</span>
          <input
            className="mr-input"
            type="url"
            value={photos[member.key]}
            placeholder={te.photoPlaceholder}
            onChange={event => setPhotos(current => ({ ...current, [member.key]: event.target.value }))}
            disabled={saving}
          />
          <span className="mr-field-hint">
            {photos[member.key] ? (
              <button type="button" className="cr-edit-link" onClick={() => setPhotos(current => ({ ...current, [member.key]: '' }))}>
                {te.photoAuto}
              </button>
            ) : te.photoHint}
          </span>
        </label>
      ))}

      <div>
        <span className="mr-field-label">{te.type}</span>
        <SelectMenu
          label={te.type}
          value={type}
          onChange={setType}
          options={[
            { value: null, label: te.typeAuto.replace('{type}', tc.typeLabels[entry.autoType]) },
            ...TYPES.map(value => ({ value, label: tc.typeLabels[value] })),
          ]}
        />
      </div>
    </Modal>
  );
}
