import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LanguageProvider } from './shared/i18n'
import Navbar from './shared/components/Navbar'
import Home from './features/home/HomePage'
import Login from './features/auth/LoginPage'
import Register from './features/auth/RegisterPage'
import Dashboard from './features/dashboard/DashboardPage'
import InsightsResult from './features/insights/InsightsResultPage'
import DiscordCallback from './features/auth/DiscordCallbackPage'
import ChatInvitePage from './features/chat/ChatInvitePage'
import Pro from './features/home/ProPage';



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
    '/dashboard',
    '/pro',
    '/insights',
    '/auth/discord/callback',
  ].includes(location.pathname) || location.pathname.startsWith('/chat/invite/');

  return (
    <div style={{width: '100%', minHeight: '100vh'}}>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/insights" element={<InsightsResult />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastrar" element={<Register />} />
        <Route path="/auth/discord/callback" element={<DiscordCallback />} />
        <Route path="/chat/invite/:token" element={<ChatInvitePage />} />
        <Route path="/pro" element={<Pro />} />
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
