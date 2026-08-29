import React, { useEffect, useMemo, useState } from 'react';
import { getStoredUser } from '../../services/authService';
import { getUnifiedWorks } from '../../services/WorkService';
import { useUser } from '../../shared/userContext';
import { useNotifications } from '../../shared/notifications';
import { relativeTime } from '../../shared/useUnifiedItems';
import Avatar from '../../shared/components/Avatar';

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

export default function DashboardHeader({ activeTab, onTabChange }) {
  const storedUser = useMemo(() => getStoredUser(), []);
  const { user: me } = useUser();
  const [works, setWorks] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { unreadCount, list: notifications, loadingList: loadingNotifications, openPanel } = useNotifications();

  useEffect(() => {
    let active = true;
    getUnifiedWorks().then((data) => active && setWorks(Array.isArray(data) ? data : [])).catch(() => {});
    return () => { active = false; };
  }, []);

  const profileSummary = useMemo(() => ({
    username: me?.username || storedUser?.username || 'usuario',
    bio: me?.bio?.trim() || 'Sem bio ainda.',
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

  // objeto de avatar: usa o /users/me quando carregou, senão só o username pro fallback
  const avatarUser = me || { username: profileSummary.username };

  const toggleNotifications = () => {
    setShowProfileMenu(false);
    setShowNotifications((value) => {
      const next = !value;
      if (next) openPanel();
      return next;
    });
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
              {unreadCount > 0 && (
                <span className="mr-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="mr-notification-panel">
                <div className="mr-panel-header">Notificações</div>
                {loadingNotifications && (notifications == null || notifications.length === 0) ? (
                  <div className="mr-notification-item">
                    <div className="mr-notification-desc">Carregando…</div>
                  </div>
                ) : !notifications || notifications.length === 0 ? (
                  <div className="mr-notification-item">
                    <div className="mr-notification-desc">Nada por aqui ainda.</div>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`mr-notification-item${item.read ? '' : ' is-unread'}`}
                    >
                      <div className="mr-notification-title">{item.title}</div>
                      <div className="mr-notification-desc">{item.message}</div>
                      <div className="mr-notification-time">{relativeTime(item.updatedAt || item.createdAt)}</div>
                    </div>
                  ))
                )}
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
              className="mr-avatar-btn"
              onClick={toggleProfileMenu}
              aria-expanded={showProfileMenu}
              aria-label="Abrir menu do perfil"
            >
              <Avatar user={avatarUser} className="mr-avatar" />
            </button>

            {showProfileMenu && (
              <div className="mr-profile-panel">
                <div className="mr-profile-compact-header">
                  <Avatar user={avatarUser} className="mr-avatar" />
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