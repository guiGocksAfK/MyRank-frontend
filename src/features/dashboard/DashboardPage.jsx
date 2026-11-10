import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import DashboardHome from './DashboardHome';
import RankingsTab from '../rankings/rankings/RankingsTab';
import CreatorsPanel from '../creators/CreatorsPanel';
import SocialPanel from '../social/SocialPanel';
import InsightsPanel from '../insights/InsightsPanel';
import InsightsResult from '../insights/InsightsResultPage';
import ProfilePanel from '../profile/ProfilePanel';
import SiteFooter from '../../shared/components/SiteFooter';
import { UserProvider, useUser } from '../../shared/userContext';
import { WorksProvider } from '../../shared/worksContext';
import { BadgeProvider } from '../../shared/badges';
import { isAuthenticated } from '../../services/authService';
import { useLanguage } from '../../shared/i18n';
import { NotificationsProvider } from '../../shared/notifications';
import { ChatProvider } from '../../shared/chat';
import './dashboard.css';

const VALID_TABS = ['home', 'rankings', 'social', 'ai', 'profile'];
const THEME_KEY = 'myrank_theme';

function readStoredTheme() {
  try { return localStorage.getItem(THEME_KEY) !== 'light'; } catch { return true; }
}

/**
 * Quem ainda não terminou o tutorial pós-cadastro volta pra ele, na etapa em que parou.
 * Até /users/me responder não mostra nada: senão o dashboard pisca antes do redirect.
 */
function OnboardingGate({ children }) {
  const { user, loading, error, refreshUser } = useUser();
  const { t } = useLanguage();
  const [retrying, setRetrying] = useState(false);
  if (loading) return null;
  // /users/me falhou com a sessão ainda guardada (rede, servidor fora): avisa em vez de abrir o dashboard vazio
  if (error || !user) {
    const retry = async () => { setRetrying(true); await refreshUser(); setRetrying(false); };
    return (
      <div className="myrank-dashboard">
        <div className="mr-panel" style={{ maxWidth: 420, margin: '20vh auto 0', padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>{t.profile.loadError}</p>
          <button type="button" className="mr-btn mr-btn-gold" onClick={retry} disabled={retrying}>
            {retrying ? t.insights.result.retrying : t.insights.result.retry}
          </button>
        </div>
      </div>
    );
  }
  if (user?.onboardingStep && user.onboardingStep !== 'DONE') {
    return <Navigate to="/bem-vindo" replace />;
  }
  return children;
}

export default function DashboardPage() {
  const location = useLocation();
  const initialTab = VALID_TABS.includes(location.state?.tab) ? location.state.tab : 'home';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profileOnSettings, setProfileOnSettings] = useState(false);
  // conversa a abrir de cara (veio de /chat/invite/:token). Consumida uma vez.
  const [openConvId, setOpenConvId] = useState(location.state?.openConvId ?? null);
  const [isDark, setIsDark] = useState(readStoredTheme);
  const [creatorsView, setCreatorsView] = useState(false);
  // análise da IA aberta dentro da aba (com a navbar): { workIds } ou null = painel
  const [insightRun, setInsightRun] = useState(null);
  // abriu direto em Rankings (vindo do tutorial): já nasce na versão que fica montada
  const [rankingsVisited, setRankingsVisited] = useState(initialTab === 'rankings');

  // Modais, menus e balões são desenhados no <body>, fora da div do dashboard: o
  // tema claro vai no <body> também, senão eles continuam escuros. Sai ao deixar o dashboard.
  useEffect(() => {
    document.body.classList.toggle('myrank-light', !isDark);
    try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch { /* só não lembra */ }
    return () => document.body.classList.remove('myrank-light');
  }, [isDark]);

  // sem sessão guardada nem adianta pedir /users/me: vai pro login
  if (!isAuthenticated()) return <Navigate to="/entrar" replace />;

  const handleThemeToggle = () => setIsDark((prev) => !prev);
  const themeClass = isDark ? '' : 'myrank-light';

  // opts.settings: abre o Perfil já nas Configurações ("Mais ajustes" da Social)
  const handleTabChange = (tab, opts = {}) => {
    setProfileOnSettings(tab === 'profile' && !!opts.settings);
    setActiveTab(tab);
    if (tab === 'rankings') setRankingsVisited(true);
    setCreatorsView(false);
    setInsightRun(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderTab = () => {
    switch (activeTab) {
      // home e rankings ficam montadas o tempo todo, lá embaixo; aqui só as outras
      case 'social':
        return (
          <SocialPanel
            initialConvId={openConvId}
            onInitialConvConsumed={() => setOpenConvId(null)}
            onNavigate={handleTabChange}
          />
        );
      case 'ai':
        return insightRun
          ? <InsightsResult workIds={insightRun.workIds} onBack={() => { setInsightRun(null); window.scrollTo({ top: 0 }); }} />
          : <InsightsPanel onGenerate={(workIds) => { setInsightRun({ workIds }); window.scrollTo({ top: 0 }); }} />;
      case 'profile':
        return <ProfilePanel isDark={isDark} onThemeToggle={handleThemeToggle} startOnSettings={profileOnSettings} />;
      default:
        return null;
    }
  };

  return (
    <UserProvider>
    <OnboardingGate>
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
          <DashboardHome onNavigate={handleTabChange} />
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
      <SiteFooter />
    </div>
    </ChatProvider>
    </NotificationsProvider>
    </BadgeProvider>
    </WorksProvider>
    </OnboardingGate>
    </UserProvider>
  );
}
