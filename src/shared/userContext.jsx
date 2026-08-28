import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMe } from '../services/userService';

/**
 * Usuário logado, compartilhado pelo dashboard. Sem isso, cada tela buscava
 * /users/me por conta própria e um edite no perfil só aparecia depois de F5.
 */
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setUser(fresh);
      return fresh;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext) ?? {
    user: null,
    loading: false,
    setUser: () => {},
    refreshUser: async () => null,
  };
}
