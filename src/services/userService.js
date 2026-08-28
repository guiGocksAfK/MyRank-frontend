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

/**
 * Normaliza um erro de request num objeto legível pra mostrar na UI.
 * Cobre os 3 casos: resposta de erro do servidor, request sem resposta
 * (rede/CORS/servidor fora) e erro de código antes de sair.
 */
export const describeRequestError = (err, context = {}) => {
  const cfg = err?.config || {};
  const res = err?.response;
  const detail = {
    when: new Date().toISOString(),
    ...context,
    method: (cfg.method || "").toUpperCase() || null,
    url: (cfg.baseURL || "") + (cfg.url || ""),
    code: err?.code || null,
    message: err?.message || String(err),
  };

  if (res) {
    detail.kind = "http";
    detail.status = res.status;
    detail.statusText = res.statusText;
    detail.responseBody =
      typeof res.data === "string" ? res.data : safeJson(res.data);
    detail.serverMessage =
      (res.data && (res.data.message || res.data.error || res.data.detail)) || null;
  } else if (err?.request) {
    detail.kind = "no-response";
    detail.hint =
      "O servidor não respondeu. Backend fora do ar, URL errada ou bloqueio de CORS.";
  } else {
    detail.kind = "client";
    detail.hint = "Erro antes de enviar o request (código no front).";
  }
  return detail;
};

const safeJson = (v) => {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return String(v);
  }
};

const requestError = (err, context) => {
  const detail = describeRequestError(err, context);
  const wrapped = new Error(
    detail.serverMessage || detail.hint || detail.message || "Falha na requisição.",
  );
  wrapped.detail = detail;
  wrapped.cause = err;
  return wrapped;
};

export const uploadAvatar = async (file) => {
  const form = new FormData();
  form.append("file", file);
  try {
    // O header 'multipart/form-data' aqui é só pra impedir o transformRequest do
    // axios de serializar o FormData como JSON (o default da instância é JSON).
    // Logo em seguida o adapter do axios o remove e o browser reescreve com o
    // boundary correto. transformRequest identidade = trava extra contra isso.
    const res = await api.put("/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
      transformRequest: [(data) => data],
    });
    return res;
  } catch (err) {
    throw requestError(err, {
      op: "uploadAvatar",
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
    });
  }
};

export const deleteAvatar = async () => {
  try {
    await api.delete("/users/me/avatar");
  } catch (err) {
    throw requestError(err, { op: "deleteAvatar" });
  }
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