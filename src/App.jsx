import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LanguageProvider } from './shared/i18n'
import Navbar from './shared/components/Navbar'
import Home from './features/home/HomePage'
import Login from './features/auth/LoginPage'
import Register from './features/auth/RegisterPage'
import Dashboard from './features/dashboard/DashboardPage'
import DiscordCallback from './features/auth/DiscordCallbackPage'
import VerifyEmail from './features/auth/VerifyEmailPage'
import ForgotPassword from './features/auth/ForgotPasswordPage'
import ChatInvitePage from './features/chat/ChatInvitePage'
import Onboarding from './features/onboarding/OnboardingPage'



const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

const isGoogleOauthConfigured = Boolean(googleClientId);
if (!isGoogleOauthConfigured) {
  console.warn('VITE_GOOGLE_CLIENT_ID não está configurado. O login Google não funcionará.');
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* a análise agora abre dentro da aba IA; o endereço antigo leva pra lá */}
        <Route path="/insights" element={<Navigate to="/dashboard" state={{ tab: 'ai' }} replace />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastrar" element={<Register />} />
        <Route path="/auth/discord/callback" element={<DiscordCallback />} />
        <Route path="/confirmar-email" element={<VerifyEmail />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/bem-vindo" element={<Onboarding />} />
        <Route path="/chat/invite/:token" element={<ChatInvitePage />} />
      </Routes>
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
