import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import InsightsResult from './components/InsightsResult'
import Pro from "./components/Pro";

function Layout() {
  const location = useLocation();
  const hideNavbar = ['/entrar', '/cadastrar', '/dashboard', '/pro', '/insights'].includes(location.pathname);

  return (
    <div style={{width: '100%', minHeight: '100vh'}}>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/insights" element={<InsightsResult />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastrar" element={<Register />} />
        <Route path="/pro" element={<Pro />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App