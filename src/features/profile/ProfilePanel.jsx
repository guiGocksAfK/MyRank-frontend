import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { getMe } from '../../services/userService';
import { socialApi } from '../social/socialData';
import Avatar from '../../shared/components/Avatar';
import { useUser } from '../../shared/userContext';
import { useLanguage } from '../../shared/i18n';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useBadges } from '../../shared/badges';
import EditProfileModal from './EditProfileModal';
import ProfileSettings from './ProfileSettings';
import ProfileBadges, { BadgeSummary } from './ProfileBadges';
import ProfileStats from './ProfileStats';
import './profile.css';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/**
 * Perfil: quem você é (topo), suas conquistas e estatísticas. Nada do que já está
 * na Dashboard (números, Hall da fama) se repete aqui. Tema, idioma, privacidade
 * e conta ficam numa página própria (o ⚙).
 */
export default function ProfilePanel({ isDark, onThemeToggle }) {
  const { t, locale } = useLanguage();
  const tp = t.profile;
  const { setUser } = useUser();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarVersion, setAvatarVersion] = useState(0); // fura o cache do <img> depois de trocar a foto
  const [summary, setSummary] = useState(null);
  const [tab, setTab] = useState('badges');
  const [badgeFilter, setBadgeFilter] = useState('all');
  const [view, setView] = useState('profile'); // 'profile' | 'settings'
  const [editing, setEditing] = useState(false);

  // atualiza o perfil daqui e o usuário compartilhado (navbar, saudação da home)
  const applyUser = (user) => {
    setProfile(user);
    setUser(user);
  };

  useEffect(() => {
    getMe()
      .then(applyUser)
      .catch(() => setError(tp.loadError))
      .finally(() => setLoading(false));
    socialApi.getSummary().then(setSummary).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { items, loading: loadingWorks } = useUnifiedItems();
  const { badges, loading: loadingBadges } = useBadges();

  const openSettings = () => { setView('settings'); window.scrollTo({ top: 0 }); };
  const closeSettings = () => { setView('profile'); window.scrollTo({ top: 0 }); };

  if (loading) return <p className="pf-muted">{tp.loading}</p>;
  if (error || !profile) return <p className="pf-muted">{error || tp.loadError}</p>;

  if (view === 'settings') {
    return (
      <ProfileSettings
        profile={profile}
        onUserChange={applyUser}
        isDark={isDark}
        onThemeToggle={onThemeToggle}
        onBack={closeSettings}
      />
    );
  }

  const since = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(locale || 'pt-BR', { month: 'long', year: 'numeric' })
    : null;
  const meta = [
    since && fmt(tp.memberSince, { date: since }),
    summary && (summary.followers === 1 ? tp.followersOne : fmt(tp.followersCount, { n: summary.followers })),
    summary && fmt(tp.followingCount, { n: summary.following }),
  ].filter(Boolean);

  const tabs = [
    { id: 'badges', label: tp.tabBadges },
    { id: 'stats', label: tp.tabStats },
  ];

  return (
    <div className="rk-page pf-page">
      <header className="pf-hero">
        <Avatar user={profile} cacheKey={avatarVersion} className="mr-avatar-lg pf-avatar" />
        <div className="pf-id">
          <h1 className="rk-page-title pf-name">{profile.username}</h1>
          {profile.bio && <p className="pf-bio">{profile.bio}</p>}
          {meta.length > 0 && (
            <p className="pf-meta">
              {meta.map((m, i) => (
                <span key={m}>{i > 0 && <span className="pf-dot" aria-hidden="true">·</span>}{m}</span>
              ))}
            </p>
          )}
        </div>
        <div className="pf-actions">
          <button type="button" className="mr-btn mr-btn-sm mr-btn-outline" onClick={() => setEditing(true)}>
            {tp.editProfile}
          </button>
          <button type="button" className="pf-icon-btn" onClick={openSettings} aria-label={tp.settings} title={tp.settings}>
            <Settings size={17} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* abas à esquerda; nas Conquistas, a barra geral e o filtro à direita */}
      <div className="pf-tabbar">
        <div className="rk-tabs" role="tablist" aria-label={tp.tabsLabel}>
          <div className="rk-tabs-scroll">
            {tabs.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={tab === x.id}
                className={`rk-tab${tab === x.id ? ' is-active' : ''}`}
                onClick={() => setTab(x.id)}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
        {tab === 'badges' && !loadingBadges && (
          <BadgeSummary badges={badges || []} filter={badgeFilter} onFilter={setBadgeFilter} />
        )}
      </div>

      {tab === 'badges' && <ProfileBadges badges={badges || []} loading={loadingBadges} filter={badgeFilter} />}

      {tab === 'stats' && <ProfileStats works={items || []} loading={loadingWorks} />}

      {editing && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(user) => {
            applyUser(user);
            setAvatarVersion((v) => v + 1);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
