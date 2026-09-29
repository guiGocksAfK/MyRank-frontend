import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useUser } from './userContext';
import { getChatUnreadCount } from '../services/chatService';

// Fallback lento: o WS empurra em tempo real; o poll cobre reconexões/queda.
const POLL_MS = 60_000;
// Deriva do VITE_API_URL (troca /api por /ws) pra não exigir uma 2ª env var;
// VITE_WS_URL sobrescreve se precisar de um host diferente.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_URL = import.meta.env.VITE_WS_URL || API_URL.replace(/\/api\/?$/, '/ws');

const ChatContext = createContext(null);

/**
 * Estado global do chat:
 * - `unreadCount` + poll de fallback
 * - `openChatWith(peer)` — pedido pra abrir um DM (DashboardPage troca de aba via `openNonce`)
 * - STOMP: eventos chegam em canais privados; handlers locais filtram pela conversa.
 */
export function ChatProvider({ children }) {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingPeer, setPendingPeer] = useState(null);
  const [openNonce, setOpenNonce] = useState(0);
  const [touchNonce, setTouchNonce] = useState(0); // bump = "recarregue a lista de conversas"
  const [connected, setConnected] = useState(false);
  const timerRef = useRef(null);

  const subsRef = useRef(new Map()); // id -> { convId, handler }
  const subSeq = useRef(0);

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

  /** Registra o handler da conversa aberta. Retorna a função de cancelamento. */
  const subscribeConversation = useCallback(
    (convId, handler) => {
      if (convId == null) return () => {};
      const id = ++subSeq.current;
      subsRef.current.set(id, { convId, handler });
      return () => {
        subsRef.current.delete(id);
      };
    },
    [],
  );

  // ── STOMP: conecta enquanto logado ────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return undefined;
    }

    const token = localStorage.getItem('myrank_token');
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      onConnect: () => {
        setConnected(true);
        client.subscribe('/user/queue/chat', () => {
          setTouchNonce((n) => n + 1);
          refreshCount();
        });
        client.subscribe('/user/queue/chat-events', (frame) => {
          try {
            const event = JSON.parse(frame.body);
            subsRef.current.forEach((entry) => {
              if (String(entry.convId) === String(event.conversationId)) entry.handler(event);
            });
          } catch {
            /* ignore frame malformado */
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();

    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, [userId, refreshCount]);

  // ── Poll de fallback ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return undefined;
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
    subscribeConversation,
    touchNonce,
    connected,
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
      subscribeConversation: () => () => {},
      touchNonce: 0,
      connected: false,
    }
  );
}
