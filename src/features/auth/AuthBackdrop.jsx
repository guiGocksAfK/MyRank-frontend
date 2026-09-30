import { SHOWCASE_FALLBACK } from "../home/showcaseFallback";

// Mesmo mundo da home: o grid de pôsteres do hero, bem escuro e desfocado,
// atrás do cartão de entrar/cadastrar. Usa a lista estática (sem esperar a API).
const TILES = SHOWCASE_FALLBACK.slice(0, 20);

const AuthBackdrop = () => (
  <div className="auth-backdrop" aria-hidden="true">
    <div className="auth-backdrop-grid">
      {TILES.map((url) => (
        <div key={url} className="auth-backdrop-tile" style={{ backgroundImage: `url(${url})` }} />
      ))}
    </div>
    <div className="auth-backdrop-veil" />
  </div>
);

export default AuthBackdrop;
