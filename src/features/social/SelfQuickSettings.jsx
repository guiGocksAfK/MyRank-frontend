import { useState } from 'react';
import { Globe, Lock, Settings2, UserCheck } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import { updateMe } from '../../services/userService';

/**
 * No seu próprio perfil pela Social: os ajustes que só fazem sentido aqui
 * (quem vê seu perfil e quem te manda mensagem). Gravam no mesmo lugar das
 * Configurações do Perfil; "Mais ajustes" leva pra lá.
 */
export default function SelfQuickSettings({ user, onSaved, onMore }) {
  const { t } = useLanguage();
  const tp = t.profile;
  const tv = t.social.profile;
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');

  const save = async (key, patch) => {
    setSaving(key);
    setError('');
    try {
      onSaved(await updateMe(patch));
    } catch (err) {
      setError(err?.response?.data?.message || tp.settingsError);
    } finally {
      setSaving(null);
    }
  };

  const group = (label, key, value, options, toPatch) => (
    <div className="social-self-field">
      <span className="social-self-label">{label}</span>
      <div className="social-cmp-filter" role="group" aria-label={label}>
        {options.map(({ id, text, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={value === id ? 'is-active' : ''}
            aria-pressed={value === id}
            disabled={saving === key}
            onClick={() => value !== id && save(key, toPatch(id))}
          >
            <Icon size={13} strokeWidth={2} aria-hidden="true" />
            {text}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="mr-panel social-col social-self">
      <h2 className="social-rail-title">{tv.quickTitle}</h2>
      {group(tp.profileLabel, 'public', (user.isPublic ?? true) ? 'public' : 'private', [
        { id: 'public', text: tp.profilePublic, icon: Globe },
        { id: 'private', text: tp.profilePrivate, icon: Lock },
      ], (id) => ({ isPublic: id === 'public' }))}
      {group(tp.messagesLabel, 'dm', user.dmPolicy || 'EVERYONE', [
        { id: 'EVERYONE', text: tp.dmEveryone, icon: Globe },
        { id: 'FOLLOWING', text: tp.dmFollowing, icon: UserCheck },
      ], (id) => ({ dmPolicy: id }))}
      {error && <p className="social-self-error" role="alert">{error}</p>}
      <button type="button" className="social-rail-more" onClick={onMore}>
        <Settings2 size={14} strokeWidth={2} aria-hidden="true" />
        {tv.moreSettings}
      </button>
    </section>
  );
}
