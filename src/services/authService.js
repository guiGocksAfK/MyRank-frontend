import api from "./api";

const saveAuthResponse = ({ token, username }) => {
  localStorage.setItem("myrank_token", token);
  localStorage.setItem("myrank_username", username);
};

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  saveAuthResponse(response.data);
  return response.data;
};

export const loginWithGoogle = async (idToken) => {
  const response = await api.post("/auth/oauth/google", { token: idToken });
  saveAuthResponse(response.data);
  return response.data;
};

export const loginWithDiscord = async (accessToken) => {
  const response = await api.post("/auth/oauth/discord", { token: accessToken });
  saveAuthResponse(response.data);
  return response.data;
};

export const getDiscordAuthUrl = () => {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error("VITE_DISCORD_CLIENT_ID não configurado.");
  }

  const currentOrigin = window.location.origin.replace(/\/$/, "");
  const configuredRedirectUri = import.meta.env.VITE_DISCORD_REDIRECT_URI?.trim();
  const redirectUri = configuredRedirectUri && !/^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/.test(currentOrigin)
    ? configuredRedirectUri
    : `${currentOrigin}/auth/discord/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: "identify email",
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
};

const PENDING_INVITE_KEY = "myrank_pending_invite";

/** Guarda um convite de grupo pra retomar depois do login. */
export const setPendingInvite = (token) => {
  try {
    localStorage.setItem(PENDING_INVITE_KEY, token);
  } catch {
    /* ignore */
  }
};

/** Consome (e limpa) o destino pós-login: a página do convite pendente ou o dashboard. */
export const takePostAuthPath = () => {
  try {
    const token = localStorage.getItem(PENDING_INVITE_KEY);
    if (token) {
      localStorage.removeItem(PENDING_INVITE_KEY);
      return `/chat/invite/${token}`;
    }
  } catch {
    /* ignore */
  }
  return "/dashboard";
};

export const logout = () => {
  localStorage.removeItem("myrank_token");
  localStorage.removeItem("myrank_username");
};

export const getToken = () => {
  return localStorage.getItem("myrank_token");
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getStoredUser = () => {
  const username = localStorage.getItem("myrank_username");
  if (!username) return null;
  return { username };
};
