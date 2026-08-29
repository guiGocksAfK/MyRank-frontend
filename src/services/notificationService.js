import api from './api';

export const getNotifications = async (page = 0, size = 20) => {
  const { data } = await api.get('/notifications', { params: { page, size } });
  return Array.isArray(data) ? data : [];
};

export const getUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count');
  return data?.count ?? 0;
};

export const markAllNotificationsRead = async () => {
  await api.post('/notifications/read-all');
};
