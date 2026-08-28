import api from "./api";

export const createUser = async (userData) => {
  const response = await api.post("/users", userData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

export const updateMe = async (data) => {
  const response = await api.put("/users/me", data);
  return response.data;
};

export const uploadAvatar = async (file) => {
  const form = new FormData();
  form.append("file", file);
  await api.put("/users/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteAvatar = async () => {
  await api.delete("/users/me/avatar");
};

/**
 * URL da foto de perfil de um usuário:
 * - avatar externo (OAuth) → usa a URL absoluta que veio do provedor
 * - foto enviada pelo usuário → aponta pro endpoint público /users/{id}/avatar
 *   (com ?t= pra furar cache quando a foto muda)
 * Retorna null quando não dá pra montar (ex.: user ainda não carregou).
 */
export const avatarUrlFor = (user, cacheKey) => {
  if (!user) return null;
  if (user.avatarUrl) return user.avatarUrl;
  if (!user.id) return null;
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const bust = cacheKey ?? user._v ?? user.updatedAt;
  const suffix = bust ? `?t=${encodeURIComponent(bust)}` : "";
  return `${base}/users/${user.id}/avatar${suffix}`;
};