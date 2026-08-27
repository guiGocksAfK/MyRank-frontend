import React, { useMemo, useState } from 'react';
import { mediaItems, badges } from '../../data/mockData';
import { getStoredUser } from '../../services/authService';

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
  const profileSummary = useMemo(() => ({
    name: storedUser?.name || storedUser?.username || 'Usuário',
    username: storedUser?.username || 'usuario',
    bio: storedUser?.bio || 'Apaixonado por jogos, filmes e livros.',
  }), [storedUser]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const totalMinutes = mediaItems.reduce((sum, item) => sum + (item.timeMinutes ?? 0), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const avgNote = (
    mediaItems.reduce((sum, item) => sum + item.finalNote, 0) / mediaItems.length
  ).toFixed(1);
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;
  const topBadges = badges.filter((badge) => badge.unlocked).slice(0, 4);

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
              LS
            </button>

            {showProfileMenu && (
              <div className="mr-profile-panel">
                <div className="mr-profile-compact-header">
                  <div className="mr-avatar">{profileSummary.name.split(' ').map((p) => p[0]).join('')}</div>
                  <div>
                    <div className="mr-profile-compact-name">{profileSummary.name}</div>
                    <div className="mr-profile-compact-username">@{profileSummary.username}</div>
                  </div>
                </div>

                <div className="mr-profile-compact-bio">{profileSummary.bio}</div>

                <div className="mr-profile-compact-grid">
                  <div>
                    <div className="mr-profile-compact-value">{mediaItems.length}</div>
                    <div className="mr-profile-compact-label">Obras</div>
                  </div>
                  <div>
                    <div className="mr-profile-compact-value">{totalHours}h</div>
                    <div className="mr-profile-compact-label">Tempo</div>
                  </div>
                  <div>
                    <div className="mr-profile-compact-value">{avgNote}</div>
                    <div className="mr-profile-compact-label">Média</div>
                  </div>
                </div>

                <div className="mr-profile-badges-row">
                  {topBadges.map((badge) => (
                    <span key={badge.id} className="mr-profile-badge-icon" title={badge.name}>
                      {badge.icon}
                    </span>
                  ))}
                  <span className="mr-profile-badge-more">+{unlockedCount - topBadges.length}</span>
                </div>

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