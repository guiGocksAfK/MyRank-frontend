import React, { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import HomeOverview from '../home/HomeOverview';
import RankingsTab from '../rankings/rankings/RankingsTab';
import CreatorsPanel from '../creators/CreatorsPanel';
import SocialPanel from '../social/SocialPanel';
import InsightsPanel from '../insights/InsightsPanel';
import ProfilePanel from '../profile/ProfilePanel';
import DashboardFooter from './DashboardFooter';
import { UserProvider } from '../../shared/userContext';
import { BadgeProvider } from '../../shared/badges';
import './dashboard.css';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [isDark, setIsDark] = useState(true);
  const [creatorsView, setCreatorsView] = useState(false);
  const [rankingsVisited, setRankingsVisited] = useState(false);

  const handleThemeToggle = () => setIsDark((prev) => !prev);
  const themeClass = isDark ? '' : 'myrank-light';

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'rankings') setRankingsVisited(true);
    setCreatorsView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeOverview />;
      case 'rankings':
        if (creatorsView) return <CreatorsPanel onBack={() => setCreatorsView(false)} />;
        return <RankingsTab onNavigateToCreators={() => setCreatorsView(true)} />;
      case 'social':
        return <SocialPanel />;
      case 'ai':
        return <InsightsPanel />;
      case 'profile':
        return <ProfilePanel isDark={isDark} onThemeToggle={handleThemeToggle} />;
      default:
        return <HomeOverview />;
    }
  };

  return (
    <UserProvider>
    <BadgeProvider>
    <div className={`myrank-dashboard ${themeClass}`}>
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <div className="mr-main">
        <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
          <HomeOverview />
        </div>
        {rankingsVisited && (
          <div style={{ display: activeTab === 'rankings' && !creatorsView ? 'block' : 'none' }}>
            <RankingsTab onNavigateToCreators={() => setCreatorsView(true)} />
          </div>
        )}
        {activeTab === 'home' || (activeTab === 'rankings' && rankingsVisited)
          ? creatorsView && <CreatorsPanel onBack={() => setCreatorsView(false)} />
          : renderTab()}
      </div>

      {/* ribbon no fim de todas as abas — stats reais vêm de /works/unified */}
      <DashboardFooter />
    </div>
    </BadgeProvider>
    </UserProvider>
  );
}