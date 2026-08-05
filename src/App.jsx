import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import InsightsResult from './components/InsightsResult'
import DiscordCallback from './components/DiscordCallback'
import Pro from "./components/Pro";



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
  ].includes(location.pathname);

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
        <Route path="/pro" element={<Pro />} />
      </Routes>
    </div>
  )
}

function App() {
  return isGoogleOauthConfigured ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </GoogleOAuthProvider>
  ) : (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App
