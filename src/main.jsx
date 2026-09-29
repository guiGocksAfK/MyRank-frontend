import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Geist servida pelo próprio site (a CSP só libera fontes de 'self')
import '@fontsource-variable/geist'
import './styles/base.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
