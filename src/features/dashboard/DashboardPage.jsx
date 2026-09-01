import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import HomeOverview from '../home/HomeOverview';
import RankingsTab from '../rankings/rankings/RankingsTab';
import CreatorsPanel from '../creators/CreatorsPanel';
import SocialPanel from '../social/SocialPanel';
import InsightsPanel from '../insights/InsightsPanel';
import ProfilePanel from '../profile/ProfilePanel';
import DashboardFooter from './DashboardFooter';
import { UserProvider } from '../../shared/userContext';
import { WorksProvider } from '../../shared/worksContext';
import { BadgeProvider } from '../../shared/badges';
import { NotificationsProvider } from '../../shared/notifications';
import { ChatProvider } from '../../shared/chat';
import './dashboard.css';

const VALID_TABS = ['home', 'rankings', 'social', 'ai', 'profile'];

export default function DashboardPage() {
  const location = useLocation();
  const initialTab = VALID_TABS.includes(location.state?.tab) ? location.state.tab : 'home';
  const [activeTab, setActiveTab] = useState(initialTab);
  // conversa a abrir de cara (veio de /chat/invite/:token). Consumida uma vez.
  const [openConvId, setOpenConvId] = useState(location.state?.openConvId ?? null);
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
        return <HomeOverview onNavigate={handleTabChange} />;
      case 'rankings':
        if (creatorsView) return <CreatorsPanel onBack={() => setCreatorsView(false)} />;
        return <RankingsTab onNavigateToCreators={() => setCreatorsView(true)} />;
      case 'social':
        return (
          <SocialPanel
            initialConvId={openConvId}
            onInitialConvConsumed={() => setOpenConvId(null)}
            onNavigate={handleTabChange}
          />
        );
      case 'ai':
        return <InsightsPanel />;
      case 'profile':
        return <ProfilePanel isDark={isDark} onThemeToggle={handleThemeToggle} />;
      default:
        return <HomeOverview onNavigate={handleTabChange} />;
    }
  };

  return (
    <UserProvider>
    <WorksProvider>
    <BadgeProvider>
    <NotificationsProvider>
    <ChatProvider>
    <div className={`myrank-dashboard ${themeClass}`}>
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <div className="mr-main">
        <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
          <HomeOverview onNavigate={handleTabChange} />
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
    </ChatProvider>
    </NotificationsProvider>
    </BadgeProvider>
    </WorksProvider>
    </UserProvider>
  );
}
