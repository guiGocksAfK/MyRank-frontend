import api from './api';

/**
 * Chat unificado: DM (conversa DIRECT) e grupo (GROUP).
 * Iniciar DM exige follow mútuo; grupo aceita qualquer usuário (o backend valida).
 */

export const getConversations = async () => {
  const { data } = await api.get('/chat/conversations');
  return Array.isArray(data) ? data : [];
};

export const startDirect = async (userId) => {
  const { data } = await api.post(`/chat/direct/${userId}`);
  return data;
};

export const createGroup = async (name, memberIds) => {
  const { data } = await api.post('/chat/conversations', { name, memberIds });
  return data;
};

export const renameConversation = async (convId, name) => {
  const { data } = await api.patch(`/chat/conversations/${convId}`, { name });
  return data;
};

export const deleteConversation = async (convId) => {
  await api.delete(`/chat/conversations/${convId}`);
};

export const getMessages = async (convId, page = 0, size = 50) => {
  const { data } = await api.get(`/chat/conversations/${convId}/messages`, { params: { page, size } });
  return Array.isArray(data) ? data : [];
};

export const sendMessage = async (convId, body) => {
  const { data } = await api.post(`/chat/conversations/${convId}/messages`, { body });
  return data;
};

export const markConversationRead = async (convId) => {
  await api.post(`/chat/conversations/${convId}/read`);
};

export const getMembers = async (convId) => {
  const { data } = await api.get(`/chat/conversations/${convId}/members`);
  return Array.isArray(data) ? data : [];
};

export const addMembers = async (convId, userIds) => {
  const { data } = await api.post(`/chat/conversations/${convId}/members`, { userIds });
  return Array.isArray(data) ? data : [];
};

export const removeMember = async (convId, userId) => {
  await api.delete(`/chat/conversations/${convId}/members/${userId}`);
};

export const getChatUnreadCount = async () => {
  const { data } = await api.get('/chat/unread-count');
  return data?.count ?? 0;
};
