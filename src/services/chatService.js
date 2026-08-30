import api from './api';

/** DM 1:1. Só rola entre quem se segue mutuamente (o backend valida). */

export const getConversations = async () => {
  const { data } = await api.get('/chat/conversations');
  return Array.isArray(data) ? data : [];
};

export const getConversation = async (userId, page = 0, size = 50) => {
  const { data } = await api.get(`/chat/with/${userId}`, { params: { page, size } });
  return Array.isArray(data) ? data : [];
};

export const markConversationRead = async (userId) => {
  await api.post(`/chat/with/${userId}/read`);
};

export const sendMessage = async (recipientId, body) => {
  const { data } = await api.post('/chat/messages', { recipientId, body });
  return data;
};

export const getChatUnreadCount = async () => {
  const { data } = await api.get('/chat/unread-count');
  return data?.count ?? 0;
};
