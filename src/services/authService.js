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
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/discord/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: "identify email",
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
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
