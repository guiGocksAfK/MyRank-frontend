import api from "./api";
import { getDiscordRedirectUri } from "./authService";

export const getMe = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

export const updateMe = async (data) => {
  const response = await api.put("/users/me", data);
  return response.data;
};

export const requestDeletionCode = async () => {
  await api.post("/users/me/deletion-code");
};

/** Exclusão definitiva: senha ou código enviado ao email da conta. */
export const deleteMe = async ({ confirmUsername, deletionCode }) => {
  await api.delete("/users/me", { data: { confirmUsername, deletionCode } });
};

/**
 * URL da foto de perfil de um usuário. Hoje é sempre `users.avatar_url` —
 * uma URL absoluta (colada pelo usuário ou herdada do avatar do OAuth).
 * Retorna null quando não há foto (o componente cai nas iniciais).
 */
export const avatarUrlFor = (user) => {
  const url = (user?.avatarUrl || '').trim();
  return /^https?:\/\//i.test(url) ? url : null;
};

/** "Conectar Discord": liga à conta logada o Discord que autorizou (é o que o bot usa). */
export const connectDiscord = async (code) => {
  const { data } = await api.post("/users/me/discord", { code, redirectUri: getDiscordRedirectUri() });
  return data;
};

export const disconnectDiscord = async () => {
  const { data } = await api.delete("/users/me/discord");
  return data;
};

/**
 * Invalida todos os tokens da conta (todos os aparelhos). Usado pelo "Sair" das
 * configurações, que em seguida faz o logout deste aparelho também.
 */
export const revokeSessions = async () => {
  const { data } = await api.post("/users/me/sessions/revoke");
  return data;
};
