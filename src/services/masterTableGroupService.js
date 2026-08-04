import api from './api';

export async function getGroups() {
  const res = await api.get('/master-table-groups');
  return res.data;
}

export async function createGroup(name, categoryIds) {
  const res = await api.post('/master-table-groups', { name, categoryIds });
  return res.data;
}

export async function updateGroup(id, name, categoryIds) {
  const res = await api.put(`/master-table-groups/${id}`, { name, categoryIds });
  return res.data;
}