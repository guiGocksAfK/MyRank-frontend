import { useEffect, useState } from "react";
import { getLoadedTiles, loadShowcaseTiles } from "../home/showcaseTiles";

// Mesmo mundo da home: o grid de pôsteres do hero, bem escuro e desfocado, atrás
// do cartão de entrar/cadastrar. Usa a mesma lista que a home mostrou na sessão.
const AuthBackdrop = () => {
  const [tiles, setTiles] = useState(getLoadedTiles);

  useEffect(() => {
    let active = true;
    loadShowcaseTiles().then((list) => active && setTiles(list));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="auth-backdrop" aria-hidden="true">
      <div className="auth-backdrop-grid">
        {tiles?.map((url) => (
          <div key={url} className="auth-backdrop-tile" style={{ backgroundImage: `url(${url})` }} />
        ))}
      </div>
      <div className="auth-backdrop-veil" />
    </div>
  );
};

export default AuthBackdrop;
