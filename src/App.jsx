import { Suspense, lazy, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LanguageProvider } from './shared/i18n'
import Navbar from './shared/components/Navbar'
import { isAuthenticated } from './services/authService'

const Home = lazy(() => import('./features/home/HomePage'))
const Login = lazy(() => import('./features/auth/LoginPage'))
const Register = lazy(() => import('./features/auth/RegisterPage'))
const Dashboard = lazy(() => import('./features/dashboard/DashboardPage'))
const DiscordCallback = lazy(() => import('./features/auth/DiscordCallbackPage'))
const ForgotPassword = lazy(() => import('./features/auth/ForgotPasswordPage'))
const ChatInvitePage = lazy(() => import('./features/chat/ChatInvitePage'))
const Onboarding = lazy(() => import('./features/onboarding/OnboardingPage'))
const LegalPage = lazy(() => import('./features/legal/LegalPage'))



const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

const isGoogleOauthConfigured = Boolean(googleClientId);
if (!isGoogleOauthConfigured) {
  console.warn('VITE_GOOGLE_CLIENT_ID não está configurado. O login Google não funcionará.');
}

/**
 * Telas de entrar/cadastrar: quem já chega com sessão vai direto pro dashboard.
 * Olha só na chegada; o login feito na própria tela navega por conta (convite pendente).
 */
function GuestOnly({ children }) {
  const [logged] = useState(isAuthenticated);
  return logged ? <Navigate to="/dashboard" replace /> : children;
}

/**
 * Home: quem já tem sessão guardada vai direto pro app, sem passar pela vitrine.
 * Se a sessão não valer mais, o próprio dashboard manda pro login (401 do /users/me).
 */
function HomeOrApp() {
  const [logged] = useState(isAuthenticated);
  return logged ? <Navigate to="/dashboard" replace /> : <Home />;
}

function Layout() {
  const location = useLocation();
  const hideNavbar = [
    '/entrar',
    '/cadastrar',
    '/esqueci-senha',
    '/bem-vindo',
    '/dashboard',
    '/insights',
    '/auth/discord/callback',
  ].includes(location.pathname) || location.pathname.startsWith('/chat/invite/');

  return (
    <div style={{width: '100%', minHeight: '100vh'}}>
      {!hideNavbar && <Navbar />}
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomeOrApp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* a análise agora abre dentro da aba IA; o endereço antigo leva pra lá */}
        <Route path="/insights" element={<Navigate to="/dashboard" state={{ tab: 'ai' }} replace />} />
        <Route path="/entrar" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/cadastrar" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/auth/discord/callback" element={<DiscordCallback />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/bem-vindo" element={<Onboarding />} />
        <Route path="/chat/invite/:token" element={<ChatInvitePage />} />
        <Route path="/termos" element={<LegalPage doc="terms" />} />
        <Route path="/privacidade" element={<LegalPage doc="privacy" />} />
        {/* endereço que não existe volta pra home, em vez da tela vazia */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </div>
  )
}

function App() {
  const tree = (
    <LanguageProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </LanguageProvider>
  )

  return isGoogleOauthConfigured ? (
    <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
  ) : (
    tree
  )
}

export default App
