import React, { useState, useMemo } from 'react';
import DashboardNavbar from './DashboardNavbar';
import HomeTab from './HomeTab';
import RankingsTab from './RankingsTab';
import CreatorsTab from './CreatorsTab';
import SocialTab from './SocialTab';
import AIInsightsTab from './AIInsightsTab';
import ProfileTab from './ProfileTab';
import Footer from './Footer';
import { INITIAL_TABLES } from '../data/mockData';   // ← pega as tabelas pra calcular stats
import './dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [isDark, setIsDark] = useState(true);
  const [creatorsView, setCreatorsView] = useState(false);

  const handleThemeToggle = () => setIsDark((prev) => !prev);
  const themeClass = isDark ? '' : 'myrank-light';

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCreatorsView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ← NOVO: calcula os stats do rodapé a partir das tabelas mockadas
  const footerStats = useMemo(() => {
    const allItems = INITIAL_TABLES.flatMap(t => t.items);
    const totalMinutes = allItems.reduce((acc, i) => acc + (i.timeMinutes || 0), 0);
    return {
      obras: allItems.length,
      horas: Math.round(totalMinutes / 60),
      amigos: 12,   // ← troca pelo número real de amigos quando tiver essa lista
    };
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'rankings':
        if (creatorsView) {
          return <CreatorsTab onBack={() => setCreatorsView(false)} />;
        }
        return <RankingsTab onNavigateToCreators={() => setCreatorsView(true)} />;
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
        onTabChange={handleTabChange}
      />
      <div className="mr-main">
        {renderTab()}
      </div>

      {/* ← NOVO: ribbon no fim de todas as abas */}
      <Footer
        stats={footerStats}
      />
    </div>
  );
}