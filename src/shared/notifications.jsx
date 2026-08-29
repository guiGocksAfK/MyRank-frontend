import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useUser } from './userContext';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
} from '../services/notificationService';

const POLL_MS = 60_000;

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [unreadCount, setUnreadCount] = useState(0);
  const [list, setList] = useState(null); // null = ainda não carregado
  const [loadingList, setLoadingList] = useState(false);
  const timerRef = useRef(null);

  const refreshCount = useCallback(async () => {
    if (!userId) return;
    try {
      setUnreadCount(await getUnreadCount());
    } catch {
      /* silencioso */
    }
  }, [userId]);

  const loadList = useCallback(async () => {
    if (!userId) return;
    setLoadingList(true);
    try {
      setList(await getNotifications(0, 20));
    } catch {
      setList([]);
    } finally {
      setLoadingList(false);
    }
  }, [userId]);

  /** Chamado quando o painel abre: carrega a lista e marca tudo como lido. */
  const openPanel = useCallback(async () => {
    await loadList();
    if (unreadCount > 0) {
      setUnreadCount(0);
      setList((prev) => (prev ? prev.map((n) => ({ ...n, read: true })) : prev));
      try {
        await markAllNotificationsRead();
      } catch {
        refreshCount();
      }
    }
  }, [loadList, unreadCount, refreshCount]);

  // poll do contador
  useEffect(() => {
    if (!userId) return undefined;
    refreshCount();
    timerRef.current = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [userId, refreshCount]);

  const value = {
    unreadCount,
    list,
    loadingList,
    loadList,
    openPanel,
    refreshCount,
  };

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return (
    useContext(NotificationsContext) ?? {
      unreadCount: 0,
      list: null,
      loadingList: false,
      loadList: async () => {},
      openPanel: async () => {},
      refreshCount: async () => {},
    }
  );
}
