import React, { useState } from 'react';
import DashboardNavbar from './DashboardNavbar';
import HomeTab from './HomeTab';
import RankingsTab from './RankingsTab';
import SocialTab from './SocialTab';
import AIInsightsTab from './AIInsightsTab';
import ProfileTab from './ProfileTab';
import './dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [isDark, setIsDark] = useState(true);

  const handleThemeToggle = () => {
    setIsDark((prev) => !prev);
  };

  const themeClass = isDark ? '' : 'myrank-light';

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'rankings':
        return <RankingsTab />;
      case 'social':
        return <SocialTab />;
      case 'ai':
        return <AIInsightsTab />;
      case 'profile':
        return <ProfileTab isDark={isDark} onThemeToggle={handleThemeToggle} />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className={`myrank-dashboard ${themeClass}`}>
      <DashboardNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
      />
      <div className="mr-main">
        {renderTab()}
      </div>
    </div>
  );
}