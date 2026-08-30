import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useUser } from './userContext';
import { getChatUnreadCount } from '../services/chatService';

const POLL_MS = 60_000;

const ChatContext = createContext(null);

/**
 * Estado global do chat:
 * - `unreadCount` + poll (igual ao sininho de notificações)
 * - `openChatWith(peer)` — pedido pra abrir uma conversa; o DashboardPage
 *   observa `openNonce` pra trocar de aba, e o ChatPanel lê `pendingPeer`.
 */
export function ChatProvider({ children }) {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingPeer, setPendingPeer] = useState(null);
  const [openNonce, setOpenNonce] = useState(0);
  const timerRef = useRef(null);

  const refreshCount = useCallback(async () => {
    if (!userId) return;
    try {
      setUnreadCount(await getChatUnreadCount());
    } catch {
      /* silencioso */
    }
  }, [userId]);

  const openChatWith = useCallback((peer) => {
    if (peer?.id) setPendingPeer(peer);
    setOpenNonce((n) => n + 1);
  }, []);

  const consumePendingPeer = useCallback(() => {
    setPendingPeer(null);
  }, []);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return undefined;
    }
    refreshCount();
    timerRef.current = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [userId, refreshCount]);

  const value = {
    unreadCount,
    refreshCount,
    openChatWith,
    openNonce,
    pendingPeer,
    consumePendingPeer,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return (
    useContext(ChatContext) ?? {
      unreadCount: 0,
      refreshCount: async () => {},
      openChatWith: () => {},
      openNonce: 0,
      pendingPeer: null,
      consumePendingPeer: () => {},
    }
  );
}
