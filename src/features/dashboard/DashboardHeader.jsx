import React, { useEffect, useMemo, useState } from 'react';
import { getStoredUser } from '../../services/authService';
import { getMe } from '../../services/userService';
import { getUnifiedWorks } from '../../services/WorkService';

const initialsFrom = (value) =>
  (value || 'U')
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const navTabs = [
  { id: 'home', label: 'Dashboard', icon: '📊' },
  { id: 'rankings', label: 'Rankings', icon: '🏆' },
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'ai', label: 'IA Insights', icon: '🤖' },
  { id: 'profile', label: 'Perfil', icon: '👤' },
];

const notifications = [
  {
    id: 1,
    title: 'Nova avaliação recebida',
    description: 'Seu último post está bombando.',
    time: '2m',
  },
  {
    id: 2,
    title: 'Meta alcançada',
    description: 'Você ganhou um novo seguidor VIP.',
    time: '1h',
  },
  {
    id: 3,
    title: 'Sugestão de conteúdo',
    description: 'Verifique os rankings de hoje.',
    time: '3h',
  },
];

export default function DashboardHeader({ activeTab, onTabChange }) {
  const storedUser = useMemo(() => getStoredUser(), []);
  const [me, setMe] = useState(null);
  const [works, setWorks] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    let active = true;
    getMe().then((data) => active && setMe(data)).catch(() => {});
    getUnifiedWorks().then((data) => active && setWorks(Array.isArray(data) ? data : [])).catch(() => {});
    return () => { active = false; };
  }, []);

  const profileSummary = useMemo(() => ({
    username: me?.username || storedUser?.username || 'usuario',
    bio: me?.bio?.trim() || 'Sem bio ainda.',
    avatarUrl: me?.avatarUrl || null,
  }), [me, storedUser]);

  // Stats reais, calculados a partir das obras do usuário (/works/unified)
  const stats = useMemo(() => {
    if (!works) return { obras: '—', horas: '—', media: '—' };
    if (works.length === 0) return { obras: 0, horas: 0, media: '—' };
    const totalMinutes = works.reduce((sum, w) => sum + num(w.timeMinutes), 0);
    const totalScore = works.reduce((sum, w) => sum + num(w.finalScore ?? w.score), 0);
    return {
      obras: works.length,
      horas: Math.round(totalMinutes / 60),
      media: (totalScore / works.length).toFixed(1),
    };
  }, [works]);

  // Categorias que o usuário realmente acompanha
  const categories = useMemo(() => {
    if (!works) return [];
    return [...new Set(works.map((w) => w.categoryName).filter(Boolean))];
  }, [works]);
  const topCategories = categories.slice(0, 4);

  const avatarInitials = initialsFrom(profileSummary.username);

  const toggleNotifications = () => {
    setShowProfileMenu(false);
    setShowNotifications((value) => !value);
  };

  const toggleProfileMenu = () => {
    setShowNotifications(false);
    setShowProfileMenu((value) => !value);
  };

  const handleViewProfile = () => {
    setShowProfileMenu(false);
    onTabChange('profile');
  };

  return (
    <nav className="mr-navbar">
      <div className="mr-navbar-inner">
        <a className="mr-logo" href="#">
          <span className="mr-logo-white">My</span>
          <span className="mr-logo-gold">Rank</span>
        </a>

        <div className="mr-nav-tabs">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              className={`mr-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="mr-nav-right">
          <div className="mr-action-group">
            <button
              type="button"
              className="mr-notification-btn"
              onClick={toggleNotifications}
              aria-expanded={showNotifications}
              aria-label="Abrir notificações"
            >
              🔔
              <span className="mr-notification-badge">3</span>
            </button>

            {showNotifications && (
              <div className="mr-notification-panel">
                <div className="mr-panel-header">Notificações</div>
                {notifications.map((item) => (
                  <div key={item.id} className="mr-notification-item">
                    <div className="mr-notification-title">{item.title}</div>
                    <div className="mr-notification-desc">{item.description}</div>
                    <div className="mr-notification-time">{item.time}</div>
                  </div>
                ))}
                <button
                  type="button"
                  className="mr-panel-action"
                  onClick={() => {
                    setShowNotifications(false);
                    onTabChange('social');
                  }}
                >
                  Ver feed de atividade
                </button>
              </div>
            )}
          </div>

          <div className="mr-action-group">
            <button
              type="button"
              className="mr-avatar"
              onClick={toggleProfileMenu}
              aria-expanded={showProfileMenu}
              aria-label="Abrir menu do perfil"
            >
              {profileSummary.avatarUrl
                ? <img src={profileSummary.avatarUrl} alt="" className="mr-avatar-img" />
                : avatarInitials}
            </button>

            {showProfileMenu && (
              <div className="mr-profile-panel">
                <div className="mr-profile-compact-header">
                  <div className="mr-avatar">
                    {profileSummary.avatarUrl
                      ? <img src={profileSummary.avatarUrl} alt="" className="mr-avatar-img" />
                      : avatarInitials}
                  </div>
                  <div>
                    <div className="mr-profile-compact-name">{profileSummary.username}</div>
                    <div className="mr-profile-compact-username">@{profileSummary.username}</div>
                  </div>
                </div>

                <div className="mr-profile-compact-bio">{profileSummary.bio}</div>

                <div className="mr-profile-compact-grid">
                  <div>
                    <div className="mr-profile-compact-value">{stats.obras}</div>
                    <div className="mr-profile-compact-label">Obras</div>
                  </div>
                  <div>
                    <div className="mr-profile-compact-value">
                      {stats.horas === '—' ? '—' : `${stats.horas}h`}
                    </div>
                    <div className="mr-profile-compact-label">Tempo</div>
                  </div>
                  <div>
                    <div className="mr-profile-compact-value">{stats.media}</div>
                    <div className="mr-profile-compact-label">Média</div>
                  </div>
                </div>

                {topCategories.length > 0 && (
                  <div className="mr-profile-badges-row">
                    {topCategories.map((name) => (
                      <span key={name} className="mr-profile-cat-chip" title={name}>
                        {name}
                      </span>
                    ))}
                    {categories.length > topCategories.length && (
                      <span className="mr-profile-badge-more">
                        +{categories.length - topCategories.length}
                      </span>
                    )}
                  </div>
                )}

                <button type="button" className="mr-panel-action" onClick={handleViewProfile}>
                  Ver perfil completo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mr-mobile-nav">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            className={`mr-mobile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}