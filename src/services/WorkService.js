import api from './api';

export async function createWork(dto) {
  const res = await api.post('/works', dto);
  return res.data;
}

export async function getWorksByCategory(categoryId) {
  const res = await api.get(`/works/category/${categoryId}`);
  return res.data;
}

export async function getUnifiedWorks() {
  const res = await api.get('/works/unified');
  return res.data;
}

export async function updateWork(id, dto) {
  const res = await api.put(`/works/${id}`, dto);
  return res.data;
}

export async function deleteWork(id) {
  await api.delete(`/works/${id}`);
}