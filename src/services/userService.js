import api from "./api";

export const createUser = async (userData) => {
  const response = await api.post("/users", userData);
  return response.data;
};