import { useState } from 'react';
import {
  ArrowLeft, Check, Database, Download, Flame, Globe, Heart, KeyRound, LayoutGrid, List, Lock, LogOut,
  MessageSquare, UserCheck, UserPlus, Users,
} from 'lucide-react';
import { updateMe, revokeSessions } from '../../services/userService';
import { logout } from '../../services/authService';
import { useLanguage, LANGUAGES } from '../../shared/i18n';
import Avatar from '../../shared/components/Avatar';
import InfoTip from '../../shared/components/InfoTip';
import DeleteAccountModal from './DeleteAccountModal';
import ChangePasswordModal from './ChangePasswordModal';
import ExportWorksModal from './ExportWorksModal';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

// nome de cada idioma escrito nele mesmo (não traduz)
const LANGUAGE_NAMES = { PT: 'Português', EN: 'English', ES: 'Español' };

// grupos de aviso (NotificationGroup no back), na ordem da tela
const NOTIFICATION_GROUPS = [
  { id: 'FOLLOWS', icon: UserPlus },
  { id: 'REACTIONS', icon: Heart },
  { id: 'COMMENTS', icon: MessageSquare },
  { id: 'TAKES', icon: Flame },
  { id: 'GROUPS', icon: Users },
];

/** Nome do ajuste, com o "?" quando precisa de explicação. */
function Label({ text, help }) {
  return (
    <span className="pf-opt-label">
      {text}
      {help && (
        <InfoTip label={text} title={text}>
          <span className="mr-infotip-text">{help}</span>
        </InfoTip>
      )}
    </span>
  );
}

/**
 * Escolha visual: cada opção é um botão que mostra o que faz (miniatura do
 * tema, a nota de exemplo, um ícone). A escolhida fica com borda dourada.
 * `hideText`: a prévia já explica (tema); o nome fica só pro leitor de tela.
 */
function Options({ label, help, value, options, onChange, disabled }) {
  return (
    <div className="pf-opt-field">
      <Label text={label} help={help} />
      <div className="pf-opts" role="group" aria-label={label}>
        {options.map(({ id, label: text, icon: Icon, preview, hideText }) => (
          <button key={id} type="button" className={`pf-opt${value === id ? ' is-on' : ''}`} aria-pressed={value === id}
            aria-label={hideText ? text : undefined} title={hideText ? text : undefined}
            disabled={disabled} onClick={() => value !== id && onChange(id)}>
            {preview}
            {!hideText && <span className="pf-opt-text">
              {Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" />}
              {text}
            </span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="mr-panel pf-set-card">
      <h2 className="pf-group-title">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Configurações: faixa da conta no topo, 4 cartões iguais (2×2) e, no rodapé,
 * exportar e excluir. Cada ajuste salva na hora (PUT /users/me); se der erro,
 * volta como estava.
 */
/** `backLabel`: texto do Voltar (vindo da Social é "Voltar", não "Perfil"). */
export default function ProfileSettings({ profile, onUserChange, isDark, onThemeToggle, onBack, backLabel }) {
  const { t, lang, setLang } = useLanguage();
  const tp = t.profile;
  const [saving, setSaving] = useState(null); // qual ajuste está salvando
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [modal, setModal] = useState(null); // 'delete' | 'password' | 'export'

  const muted = new Set(profile.mutedNotifications || []);
  const provider = profile.authProvider || 'LOCAL';
  const signedIn = provider === 'LOCAL' || profile.hasPassword
    ? tp.signedInLocal
    : fmt(tp.signedInSocial, { provider: provider === 'GOOGLE' ? 'Google' : 'Discord' });

  // salva um pedaço e já mostra o novo estado; erro desfaz
  const save = async (key, patch) => {
    const before = profile;
    onUserChange({ ...profile, ...patch });
    setSaving(key);
    setError('');
    setNotice('');
    try {
      onUserChange(await updateMe(patch));
    } catch (err) {
      onUserChange(before);
      setError(err?.response?.data?.message || tp.settingsError);
    } finally {
      setSaving(null);
    }
  };

  const toggleGroup = (group) => {
    const next = new Set(muted);
    if (next.has(group)) next.delete(group); else next.add(group);
    save('notif', { mutedNotifications: [...next] });
  };

  // "Sair" desconecta todos os aparelhos de uma vez. Se o pedido falhar (sem
  // internet, por exemplo), pelo menos este aparelho sai.
  const signOut = async () => {
    setSigningOut(true);
    try {
      await revokeSessions();
    } catch {
      // segue pro logout local
    }
    logout();
    window.location.assign('/');
  };

  return (
    <div className="pf-settings">
      <div>
        <button type="button" className="cr-back" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {backLabel || tp.backToProfile}
        </button>
        <h1 className="rk-page-title">{tp.settings}</h1>
      </div>

      {(error || notice) && (
        <p className={`pf-set-notice${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>{error || notice}</p>
      )}

      {/* faixa da conta: quem é você e as ações da conta */}
      <section className="mr-panel pf-account" aria-label={tp.account}>
        <Avatar user={profile} className="mr-avatar pf-account-avatar" />
        <div className="pf-account-who">
          <span className="pf-account-email">{profile.email}</span>
          <span className="pf-account-sub">{signedIn}</span>
        </div>
        <div className="pf-account-actions">
          {profile.hasPassword && (
            <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => setModal('password')}>
              <KeyRound size={14} strokeWidth={2} aria-hidden="true" />
              {tp.changePassword}
            </button>
          )}
          <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" title={tp.signOutHint}
            disabled={signingOut} onClick={signOut}>
            <LogOut size={14} strokeWidth={2} aria-hidden="true" />
            {signingOut ? tp.signingOut : tp.signOut}
          </button>
        </div>
      </section>

      <div className="pf-set-grid">
        <Card title={tp.appearance}>
          <Options label={tp.theme} value={isDark ? 'dark' : 'light'} onChange={onThemeToggle}
            options={[
              { id: 'dark', label: tp.themeDark, hideText: true, preview: <span className="pf-theme-mini is-dark" aria-hidden="true"><i /></span> },
              { id: 'light', label: tp.themeLight, hideText: true, preview: <span className="pf-theme-mini is-light" aria-hidden="true"><i /></span> },
            ]} />
          <Options label={tp.language} value={lang} onChange={setLang}
            options={LANGUAGES.map((code) => ({ id: code, label: LANGUAGE_NAMES[code] || code }))} />
        </Card>

        <Card title={tp.rankingsGroup}>
          <Options label={tp.scoreLabel} help={tp.scoreDesc} value={profile.weightedByDefault ? 'weighted' : 'simple'}
            disabled={saving === 'weighted'} onChange={(v) => save('weighted', { weightedByDefault: v === 'weighted' })}
            options={[
              { id: 'simple', label: tp.scoreSimple, preview: <span className="pf-opt-big">{tp.scoreSimpleEx}</span> },
              { id: 'weighted', label: tp.scoreWeighted, preview: <span className="pf-opt-big">{tp.scoreWeightedEx}</span> },
            ]} />
          <Options label={tp.rankingsView} value={profile.rankingsView || 'LIST'} disabled={saving === 'view'}
            onChange={(v) => save('view', { rankingsView: v })}
            options={[{ id: 'LIST', label: tp.viewList, icon: List }, { id: 'GRID', label: tp.viewGrid, icon: LayoutGrid }]} />
        </Card>

        <Card title={tp.privacy}>
          <Options label={tp.profileLabel} help={tp.profileDesc} value={(profile.isPublic ?? true) ? 'public' : 'private'}
            disabled={saving === 'public'} onChange={(v) => save('public', { isPublic: v === 'public' })}
            options={[
              { id: 'public', label: tp.profilePublic, icon: Globe },
              { id: 'private', label: tp.profilePrivate, icon: Lock },
            ]} />
          <Options label={tp.messagesLabel} help={tp.dmPolicyDesc} value={profile.dmPolicy || 'EVERYONE'}
            disabled={saving === 'dm'} onChange={(v) => save('dm', { dmPolicy: v })}
            options={[
              { id: 'EVERYONE', label: tp.dmEveryone, icon: Globe },
              { id: 'FOLLOWING', label: tp.dmFollowing, icon: UserCheck },
            ]} />
        </Card>

        <Card title={tp.notifications}>
          {/* uma linha por aviso: ✓ dourado = recebe; vazio = silenciado */}
          <div className="pf-opt-field">
            <Label text={tp.notifyLabel} />
            <div className="pf-notify" role="group" aria-label={tp.notifyLabel}>
              {NOTIFICATION_GROUPS.map(({ id, icon: Icon }) => {
                const on = !muted.has(id);
                return (
                  <button key={id} type="button" className={`pf-notify-row${on ? ' is-on' : ''}`} aria-pressed={on}
                    title={tp.notif[id].desc} disabled={saving === 'notif'} onClick={() => toggleGroup(id)}>
                    <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                    <span className="pf-notify-name">{tp.notif[id].label}</span>
                    <span className="pf-notify-check" aria-hidden="true">
                      {on && <Check size={12} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* faixa "Seus dados", par da faixa da conta lá em cima */}
      <section className="mr-panel pf-account pf-data" aria-label={tp.yourData}>
        <Database className="pf-data-icon" size={20} strokeWidth={1.7} aria-hidden="true" />
        <div className="pf-account-who">
          <span className="pf-account-email">{tp.yourData}</span>
          <span className="pf-account-sub">{tp.yourDataDesc}</span>
        </div>
        <div className="pf-account-actions">
          <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => setModal('export')}>
            <Download size={14} strokeWidth={2} aria-hidden="true" />
            {tp.exportWorks}
          </button>
          <button type="button" className="pf-set-delete" onClick={() => setModal('delete')}>{tp.deleteAccount}</button>
        </div>
      </section>

      {modal === 'export' && <ExportWorksModal onClose={() => setModal(null)} />}
      {modal === 'delete' && <DeleteAccountModal user={profile} onClose={() => setModal(null)} />}
      {modal === 'password' && (
        <ChangePasswordModal email={profile.email} onClose={() => setModal(null)}
          onDone={() => { setModal(null); setError(''); setNotice(tp.passwordDone); }} />
      )}
    </div>
  );
}
