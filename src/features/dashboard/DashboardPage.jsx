import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import HomeOverview from '../home/HomeOverview';
import RankingsTab from '../rankings/rankings/RankingsTab';
import CreatorsPanel from '../creators/CreatorsPanel';
import SocialPanel from '../social/SocialPanel';
import ChatPanel from '../chat/ChatPanel';
import InsightsPanel from '../insights/InsightsPanel';
import ProfilePanel from '../profile/ProfilePanel';
import DashboardFooter from './DashboardFooter';
import { UserProvider } from '../../shared/userContext';
import { BadgeProvider } from '../../shared/badges';
import { NotificationsProvider } from '../../shared/notifications';
import { ChatProvider, useChat } from '../../shared/chat';
import './dashboard.css';

const VALID_TABS = ['home', 'rankings', 'social', 'chat', 'ai', 'profile'];

/** Ponte: quando algo pede pra abrir o chat (openChatWith), troca de aba. */
function ChatTabBridge({ onOpen }) {
  const { openNonce } = useChat();
  const seen = useRef(openNonce);
  useEffect(() => {
    if (openNonce !== seen.current) {
      seen.current = openNonce;
      onOpen();
    }
  }, [openNonce, onOpen]);
  return null;
}

export default function DashboardPage() {
  const location = useLocation();
  const initialTab = VALID_TABS.includes(location.state?.tab) ? location.state.tab : 'home';
  const [activeTab, setActiveTab] = useState(initialTab);
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
        return <SocialPanel />;
      case 'chat':
        return <ChatPanel />;
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
    <BadgeProvider>
    <NotificationsProvider>
    <ChatProvider>
    <ChatTabBridge onOpen={() => handleTabChange('chat')} />
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
    </UserProvider>
  );
}