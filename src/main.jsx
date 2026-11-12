import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Geist servida pelo próprio site (a CSP só libera fontes de 'self')
import '@fontsource-variable/geist'
import './styles/base.css'
import './index.css'
import App from './App.jsx'
import { loadLanguage, readStoredLang } from './shared/locales/load'

// quem usa inglês/espanhol: baixa os textos antes de desenhar, pra tela não
// abrir em português e trocar em seguida. Sem rede, abre em português mesmo.
loadLanguage(readStoredLang())
  .catch(() => {})
  .then(() => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
