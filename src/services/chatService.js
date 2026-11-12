import api from './api';

// Só no dev: com "Dados de teste" ligado (o mesmo interruptor da Social), as
// chamadas vão pro chatMock.js; no build de produção esse caminho nem existe.
const mockOn = () => {
  if (!import.meta.env.DEV) return false;
  try { return localStorage.getItem('myrank_social_mock') === '1'; } catch { return false; }
};
const mocked = (name, real) => async (...args) => {
  if (import.meta.env.DEV && mockOn()) {
    const { chatMock } = await import('../features/chat/chatMock');
    return chatMock[name](...args);
  }
  return real(...args);
};

/**
 * Chat unificado: DM (DIRECT) e grupo (GROUP).
 * Grupo: foto (URL), acesso OPEN/REQUEST/CLOSED, cargos OWNER>ADMIN>MOD>MEMBER,
 * fila de pedidos. Mensagens: responder, editar, apagar (lápide), reagir (1 emoji).
 */

/** Set fixo de reações (mesma ordem do backend). */
export const CHAT_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😠', '🎉', '🔥', '👀', '🙏'];

// ── Conversas ────────────────────────────────────────────────────────────

export const getConversations = mocked('getConversations', async () => {
  const { data } = await api.get('/chat/conversations');
  return Array.isArray(data) ? data : [];
});

export const startDirect = mocked('startDirect', async (userId) => {
  const { data } = await api.post(`/chat/direct/${userId}`);
  return data;
});

/** Usuários que você segue de volta e ainda não tem DM (pra sugerir "diga oi"). */
export const getSuggestedDirects = mocked('getSuggestedDirects', async () => {
  const { data } = await api.get('/chat/directs/suggested');
  return Array.isArray(data) ? data : [];
});

export const createGroup = mocked('createGroup', async ({
  name,
  memberIds = [],
  access = 'CLOSED',
  imageUrl = '',
  description = '',
}) => {
  const { data } = await api.post('/chat/conversations', {
    name,
    memberIds,
    access,
    imageUrl,
    description,
  });
  return data;
});

/** Patch do grupo: passe só os campos que quer mudar. imageUrl:'' remove a foto. */
export const updateGroup = mocked('updateGroup', async (convId, patch) => {
  const { data } = await api.patch(`/chat/conversations/${convId}`, patch);
  return data;
});

export const deleteConversation = mocked('deleteConversation', async (convId) => {
  await api.delete(`/chat/conversations/${convId}`);
});

// ── Diretório / entrada ──────────────────────────────────────────────────

export const getDirectory = mocked('getDirectory', async (q = '', page = 0) => {
  const { data } = await api.get('/chat/directory', { params: { q, page } });
  return Array.isArray(data) ? data : [];
});

/** Entra (OPEN) ou pede pra entrar (REQUEST). Retorna { state: 'JOINED' | 'REQUESTED' }. */
export const joinGroup = mocked('joinGroup', async (convId) => {
  const { data } = await api.post(`/chat/conversations/${convId}/join`);
  return data?.state ?? 'REQUESTED';
});

export const cancelJoinRequest = mocked('cancelJoinRequest', async (convId) => {
  await api.delete(`/chat/conversations/${convId}/join`);
});

// ── Link de convite (reutilizável + revogável) ──────────────────────────

/** Token atual do grupo (null se não houver). Só OWNER/ADMIN. */
export const getInviteToken = mocked('getInviteToken', async (convId) => {
  const { data } = await api.get(`/chat/conversations/${convId}/invite`);
  return data?.token ?? null;
});

/** Gera (ou rotaciona) o link e retorna o novo token. */
export const rotateInviteToken = mocked('rotateInviteToken', async (convId) => {
  const { data } = await api.post(`/chat/conversations/${convId}/invite`);
  return data?.token ?? null;
});

export const revokeInviteToken = mocked('revokeInviteToken', async (convId) => {
  await api.delete(`/chat/conversations/${convId}/invite`);
});

/** Aceita um convite pelo token; retorna a conversa (ChatConversationDTO). */
export const acceptInvite = mocked('acceptInvite', async (token) => {
  const { data } = await api.post(`/chat/invite/${encodeURIComponent(token)}`);
  return data;
});

/** Monta a URL completa do convite a partir de um token. */
export const inviteUrl = (token) => `${window.location.origin}/chat/invite/${token}`;

export const getJoinRequests = mocked('getJoinRequests', async (convId) => {
  const { data } = await api.get(`/chat/conversations/${convId}/requests`);
  return Array.isArray(data) ? data : [];
});

export const approveJoinRequest = mocked('approveJoinRequest', async (convId, userId) => {
  await api.post(`/chat/conversations/${convId}/requests/${userId}/approve`);
});

export const rejectJoinRequest = mocked('rejectJoinRequest', async (convId, userId) => {
  await api.post(`/chat/conversations/${convId}/requests/${userId}/reject`);
});

// ── Mensagens ────────────────────────────────────────────────────────────

export const getMessages = mocked('getMessages', async (convId, page = 0, size = 50) => {
  const { data } = await api.get(`/chat/conversations/${convId}/messages`, { params: { page, size } });
  return Array.isArray(data) ? data : [];
});

export const sendMessage = mocked('sendMessage', async (convId, body, replyToId = null) => {
  const { data } = await api.post(`/chat/conversations/${convId}/messages`, { body, replyToId });
  return data;
});

export const editMessage = mocked('editMessage', async (messageId, body) => {
  const { data } = await api.patch(`/chat/messages/${messageId}`, { body });
  return data;
});

export const deleteMessage = mocked('deleteMessage', async (messageId) => {
  const { data } = await api.delete(`/chat/messages/${messageId}`);
  return data;
});

export const reactMessage = mocked('reactMessage', async (messageId, emoji) => {
  const { data } = await api.post(`/chat/messages/${messageId}/react`, { emoji });
  return data;
});

export const markConversationRead = mocked('markConversationRead', async (convId) => {
  await api.post(`/chat/conversations/${convId}/read`);
});

/** Sinaliza "digitando…" (throttle no chamador). */
export const sendTyping = mocked('sendTyping', async (convId) => {
  try {
    await api.post(`/chat/conversations/${convId}/typing`);
  } catch {
    /* best-effort */
  }
});

// ── Membros / cargos ────────────────────────────────────────────────────

export const getMembers = mocked('getMembers', async (convId) => {
  const { data } = await api.get(`/chat/conversations/${convId}/members`);
  return Array.isArray(data) ? data : [];
});

export const addMembers = mocked('addMembers', async (convId, userIds) => {
  const { data } = await api.post(`/chat/conversations/${convId}/members`, { userIds });
  return Array.isArray(data) ? data : [];
});

export const removeMember = mocked('removeMember', async (convId, userId) => {
  await api.delete(`/chat/conversations/${convId}/members/${userId}`);
});

export const setMemberRole = mocked('setMemberRole', async (convId, userId, role) => {
  const { data } = await api.put(`/chat/conversations/${convId}/members/${userId}/role`, { role });
  return Array.isArray(data) ? data : [];
});

export const getChatUnreadCount = mocked('getChatUnreadCount', async () => {
  const { data } = await api.get('/chat/unread-count');
  return data?.count ?? 0;
});
