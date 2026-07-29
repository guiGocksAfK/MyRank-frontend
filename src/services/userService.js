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