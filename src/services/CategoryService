import api from './api';

export async function getCategories() {
  const res = await api.get('/categories');
  return res.data;
}

export async function createCategory(name) {
  const res = await api.post('/categories', { name });
  return res.data;
}

export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`);
}