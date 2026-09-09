import axios from "axios";
import { reportServerDown } from "../shared/serverStatus";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  // O cold start do Render (plano free) pode passar de 30s; se estourar isso,
  // a tela de "acordando o servidor" assume e fica re-tentando.
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("myrank_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Detecta o back fora do ar / hibernando: sem resposta, timeout ou 502/503/504.
// 4xx (login errado, etc.) NÃO conta. Chamadas passivas de enriquecimento
// (/external/*: pôsteres do hero, autocomplete) também NÃO disparam a tela —
// elas já têm fallback próprio e não valem uma tela cheia.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const coldStart =
      (!error?.response ||
        error.code === "ECONNABORTED" ||
        status === 502 ||
        status === 503 ||
        status === 504) &&
      !url.includes("/external/");
    if (coldStart) reportServerDown();
    return Promise.reject(error);
  },
);

export default api;
