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
 * - STOMP: `subscribeConversation(convId, handler)` pra thread aberta, e um canal
 *   privado /user/queue/chat que dispara `touchNonce` (sidebar recarrega) + `refreshCount`.
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

  const clientRef = useRef(null);
  const subsRef = useRef(new Map()); // id -> { convId, handler, sub }
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

  const attach = useCallback((entry) => {
    const client = clientRef.current;
    if (!client || !client.connected || entry.sub) return;
    entry.sub = client.subscribe(`/topic/conversation.${entry.convId}`, (frame) => {
      try {
        entry.handler(JSON.parse(frame.body));
      } catch {
        /* ignore frame malformado */
      }
    });
  }, []);

  /** Assina os eventos de uma conversa. Retorna a função de cancelamento. */
  const subscribeConversation = useCallback(
    (convId, handler) => {
      if (convId == null) return () => {};
      const id = ++subSeq.current;
      const entry = { convId, handler, sub: null };
      subsRef.current.set(id, entry);
      attach(entry);
      return () => {
        const e = subsRef.current.get(id);
        try {
          e?.sub?.unsubscribe();
        } catch {
          /* já desconectado */
        }
        subsRef.current.delete(id);
      };
    },
    [attach],
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
        subsRef.current.forEach((entry) => {
          entry.sub = null;
          attach(entry);
        });
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    clientRef.current = client;
    client.activate();

    return () => {
      subsRef.current.forEach((entry) => {
        try {
          entry.sub?.unsubscribe();
        } catch {
          /* ignore */
        }
        entry.sub = null;
      });
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [userId, refreshCount, attach]);

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
