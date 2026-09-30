import api from './api';

export async function getCategories() {
  const res = await api.get('/categories');
  return res.data;
}

export async function createCategory(table) {
  const res = await api.post('/categories', table);
  return res.data;
}

export async function updateCategory(id, table) {
  const res = await api.put(`/categories/${id}`, table);
  return res.data;
}

export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`);
}

export async function createSubcategory(categoryId, name) {
  const res = await api.post(`/categories/${categoryId}/subcategories`, { name });
  return res.data;
}

export async function renameSubcategory(categoryId, subcategoryId, name) {
  const res = await api.put(`/categories/${categoryId}/subcategories/${subcategoryId}`, { name });
  return res.data;
}

export async function deleteSubcategory(categoryId, subcategoryId) {
  await api.delete(`/categories/${categoryId}/subcategories/${subcategoryId}`);
}
