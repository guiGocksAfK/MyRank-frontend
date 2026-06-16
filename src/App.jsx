import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'

function Layout() {
  const location = useLocation();
  const hideNavbar = ['/entrar', '/cadastrar', '/dashboard'].includes(location.pathname);

  return (
    <div style={{width: '100%', minHeight: '100vh'}}>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastrar" element={<Register />} />
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