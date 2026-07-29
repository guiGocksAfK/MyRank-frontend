import api from "./api";

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  const { token, username } = response.data;

  localStorage.setItem("myrank_token", token);
  localStorage.setItem("myrank_username", username);

  return response.data;
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