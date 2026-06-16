import React from 'react';

const navTabs = [
  { id: 'home', label: 'Dashboard', icon: '📊' },
  { id: 'rankings', label: 'Rankings', icon: '🏆' },
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'ai', label: 'IA Insights', icon: '🤖' },
  { id: 'profile', label: 'Perfil', icon: '👤' },
];

export default function DashboardNavbar({ activeTab, onTabChange, isDark, onThemeToggle }) {
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
          <div className="mr-theme-toggle">
            <span>{isDark ? '🌙' : '☀️'}</span>
            <button
              className={`mr-switch ${isDark ? 'checked' : ''}`}
              onClick={onThemeToggle}
            >
              <span className="mr-switch-thumb" />
            </button>
          </div>

          <button className="mr-notification-btn">
            🔔
            <span className="mr-notification-badge">3</span>
          </button>

          <div className="mr-avatar">LS</div>
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