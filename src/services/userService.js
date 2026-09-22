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

/** Exclusão definitiva: { confirmUsername, password? } (senha só se a conta tiver). */
export const deleteMe = async ({ confirmUsername, password }) => {
  await api.delete("/users/me", { data: { confirmUsername, password } });
};

/**
 * URL da foto de perfil de um usuário. Hoje é sempre `users.avatar_url` —
 * uma URL absoluta (colada pelo usuário ou herdada do avatar do OAuth).
 * Retorna null quando não há foto (o componente cai nas iniciais).
 */
export const avatarUrlFor = (user) => user?.avatarUrl || null;
