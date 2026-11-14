import api from './api';

let cachedOwner = null;
let cachedList = null;
let inflight = null;

function currentOwner() {
  try { return localStorage.getItem('myrank_username') || ''; } catch { return ''; }
}

function invalidateCategories() {
  cachedList = null;
  inflight = null;
}

export function peekCategories() {
  return cachedOwner === currentOwner() ? cachedList : null;
}

export async function getCategories({ fresh = false } = {}) {
  const owner = currentOwner();
  if (cachedOwner !== owner) {
    cachedOwner = owner;
    cachedList = null;
    inflight = null;
  }
  if (!fresh && cachedList) return cachedList;
  if (!fresh && inflight) return inflight;
  inflight = api.get('/categories')
    .then((res) => {
      if (cachedOwner === owner) cachedList = res.data;
      return res.data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function createCategory(table) {
  const res = await api.post('/categories', table);
  invalidateCategories();
  return res.data;
}

export async function updateCategory(id, table) {
  const res = await api.put(`/categories/${id}`, table);
  invalidateCategories();
  return res.data;
}

/** Lista completa de campos próprios: sem id = novo; id que sumiu = removido (com os valores). */
export async function updateCustomFields(id, fields) {
  const res = await api.put(`/categories/${id}/custom-fields`, fields);
  invalidateCategories();
  return res.data;
}

export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`);
  invalidateCategories();
}

export async function createSubcategory(categoryId, name) {
  const res = await api.post(`/categories/${categoryId}/subcategories`, { name });
  invalidateCategories();
  return res.data;
}

export async function renameSubcategory(categoryId, subcategoryId, name) {
  const res = await api.put(`/categories/${categoryId}/subcategories/${subcategoryId}`, { name });
  invalidateCategories();
  return res.data;
}

export async function deleteSubcategory(categoryId, subcategoryId) {
  await api.delete(`/categories/${categoryId}/subcategories/${subcategoryId}`);
  invalidateCategories();
}
