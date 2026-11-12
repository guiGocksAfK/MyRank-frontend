import { useCallback, useRef, useState } from 'react';
import { getStoredUser, logout } from '../../services/authService';
import { useUser } from '../../shared/userContext';
import { useNotifications } from '../../shared/notifications';
import { relativeTime } from '../../shared/useUnifiedItems';
import { useLanguage, LANGUAGES } from '../../shared/i18n';
import Avatar from '../../shared/components/Avatar';
import { NavbarShell } from '../../shared/components/Navbar';
import useDismiss from '../../shared/components/useDismiss';

const TABS = ['home', 'rankings', 'social', 'ai', 'profile'];

/** Ícones de traço, de uma cor só (só aparecem na barra do celular). */
const TAB_ICONS = {
  home: <path d="M4 13h6V4H4zM14 20h6v-9h-6zM14 4v4h6V4zM4 20h6v-4H4z" />,
  rankings: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" />,
  social: <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.85M16 4.15a3.5 3.5 0 0 1 0 6.7" />,
  ai: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  profile: <path d="M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />,
};

const TabIcon = ({ id }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {TAB_ICONS[id]}
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export default function DashboardHeader({ activeTab, onTabChange }) {
  const { user: me } = useUser();
  const { lang, setLang, t } = useLanguage();
  const th = t.dash.header;
  const { unreadCount, list: notifications, loadingList: loadingNotifications, openPanel } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifBox = useRef(null);
  const notifButton = useRef(null);
  const profileBox = useRef(null);
  const profileButton = useRef(null);
  const closeNotifications = useCallback(() => setShowNotifications(false), []);
  const closeProfileMenu = useCallback(() => setShowProfileMenu(false), []);
  useDismiss(showNotifications, closeNotifications, notifBox, notifButton);
  useDismiss(showProfileMenu, closeProfileMenu, profileBox, profileButton);

  // /users/me quando carregou; antes disso, o username guardado no login pro avatar não piscar vazio
  const avatarUser = me || getStoredUser() || { username: '' };

  const goTo = (tab) => {
    setShowNotifications(false);
    setShowProfileMenu(false);
    onTabChange(tab);
  };

  const toggleNotifications = () => {
    setShowProfileMenu(false);
    setShowNotifications((open) => {
      if (!open) openPanel();
      return !open;
    });
  };

  const toggleProfileMenu = () => {
    setShowNotifications(false);
    setShowProfileMenu((open) => !open);
  };

  const signOut = async () => {
    await logout();
    // recarrega do zero: nenhum contexto do usuário anterior sobra na memória
    window.location.assign('/');
  };

  const tabs = (
    <>
      {TABS.map((id) => (
        <button
          key={id}
          type="button"
          className={`app-nav-tab${activeTab === id ? ' active' : ''}`}
          aria-current={activeTab === id ? 'page' : undefined}
          onClick={() => goTo(id)}
        >
          {t.dash.tabs[id]}
        </button>
      ))}
    </>
  );

  return (
    <>
      <NavbarShell
        logoTo="/dashboard"
        onLogoClick={(e) => { e.preventDefault(); goTo('home'); }}
        center={tabs}
      >
        <div className="navbar-menu-box" ref={notifBox}>
          <button
            ref={notifButton}
            type="button"
            className="mr-btn mr-btn-ghost navbar-icon-btn"
            onClick={toggleNotifications}
            aria-expanded={showNotifications}
            aria-label={th.openNotifications}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="navbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="mr-menu navbar-menu app-notif-menu">
              <div className="mr-menu-label">{th.notifications}</div>
              {loadingNotifications && !notifications?.length ? (
                <div className="app-notif-empty">{th.notifLoading}</div>
              ) : !notifications?.length ? (
                <div className="app-notif-empty">{th.notifEmpty}</div>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className={`app-notif-item${item.read ? '' : ' is-unread'}`}>
                    <div className="app-notif-title">{item.title}</div>
                    <div className="app-notif-desc">{item.message}</div>
                    <div className="app-notif-time">{relativeTime(item.updatedAt || item.createdAt, lang)}</div>
                  </div>
                ))
              )}
              <button type="button" className="mr-btn mr-btn-outline mr-btn-sm app-menu-wide" onClick={() => goTo('social')}>
                {th.seeActivityFeed}
              </button>
            </div>
          )}
        </div>

        <div className="navbar-menu-box" ref={profileBox}>
          <button
            ref={profileButton}
            type="button"
            className="app-avatar-btn"
            onClick={toggleProfileMenu}
            aria-expanded={showProfileMenu}
            aria-haspopup="menu"
            aria-label={th.openProfileMenu}
          >
            <Avatar user={avatarUser} className="mr-avatar" />
          </button>

          {showProfileMenu && (
            <div className="mr-menu navbar-menu app-profile-menu" role="menu">
              <div className="app-menu-user">
                <Avatar user={avatarUser} className="mr-avatar" />
                <div className="app-menu-user-name">@{avatarUser.username}</div>
              </div>
              <button type="button" role="menuitem" className="mr-menu-item" onClick={() => goTo('profile')}>
                {th.viewProfile}
              </button>

              <div className="app-menu-sep" />
              <div className="mr-menu-label" aria-hidden="true">{t.nav.subtitles}</div>
              {LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={code === lang}
                  className="mr-menu-item"
                  onClick={() => { if (code !== lang) setLang(code); }}
                >
                  <span className="mr-menu-radio" aria-hidden="true" />
                  {code}
                </button>
              ))}

              <div className="app-menu-sep" />
              <button type="button" role="menuitem" className="mr-menu-item" onClick={signOut}>
                {th.signOut}
              </button>
            </div>
          )}
        </div>
      </NavbarShell>

      {/* Celular: as abas descem pra uma barra própria, com ícone em cima do nome */}
      <nav className="app-mobile-nav" aria-label={th.tabsLabel}>
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            className={`app-mobile-tab${activeTab === id ? ' active' : ''}`}
            aria-current={activeTab === id ? 'page' : undefined}
            onClick={() => goTo(id)}
          >
            <TabIcon id={id} />
            <span>{t.dash.tabs[id]}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
