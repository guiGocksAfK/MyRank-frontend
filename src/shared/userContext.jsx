import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMe } from '../services/userService';
import { useLanguage } from './i18n';

/**
 * Usuário logado, compartilhado pelo dashboard. Sem isso, cada tela buscava
 * /users/me por conta própria e um edite no perfil só aparecia depois de F5.
 */
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  // /users/me falhou (rede, servidor fora): não é o mesmo que estar deslogado
  const [error, setError] = useState(false);
  const { setLang } = useLanguage();

  const setUser = useCallback((next) => {
    // _v: carimbo que muda a cada atualização, usado pra furar o cache do <img> do avatar
    setUserState(next ? { ...next, _v: Date.now() } : next);
    if (next?.username) {
      localStorage.setItem('myrank_username', next.username);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await getMe();
      setError(false);
      setUser(fresh);
      // Idioma salvo no banco manda: sincroniza sem re-persistir.
      if (fresh?.language) setLang(fresh.language, { persist: false });
      return fresh;
    } catch {
      setError(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLang]);

  useEffect(() => {
    let active = true;
    getMe()
      .then((fresh) => {
        if (!active) return;
        setError(false);
        setUser(fresh);
        if (fresh?.language) setLang(fresh.language, { persist: false });
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [setUser, setLang]);

  return (
    <UserContext.Provider value={{ user, loading, error, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext) ?? {
    user: null,
    loading: false,
    error: false,
    setUser: () => {},
    refreshUser: async () => null,
  };
}
