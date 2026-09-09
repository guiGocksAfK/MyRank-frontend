import axios from "axios";
import { reportServerDown, whenServerUp } from "../shared/serverStatus";

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

// Cold start do Render (plano free): sem resposta, timeout ou 502/503/504.
// Nesse caso mostra a tela de "acordando o servidor", espera o /health voltar
// e REFAZ a mesma requisição — o await de quem chamou (ex.: loginWithGoogle)
// resolve normalmente, sem o usuário refazer nada.
// 4xx (login errado, etc.) NÃO conta. /external/* (pôsteres do hero, autocomplete)
// tem fallback próprio e não dispara a tela.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const status = error?.response?.status;
    const url = config?.url || "";

    const looksAsleep =
      !error?.response ||
      error.code === "ECONNABORTED" ||
      status === 502 ||
      status === 503 ||
      status === 504;

    if (
      !looksAsleep ||
      !config ||
      config._wokeRetry ||
      url.includes("/external/")
    ) {
      return Promise.reject(error);
    }

    reportServerDown();       // mostra a tela de carregamento
    await whenServerUp();     // resolve quando o /health responde (poll no provider)
    config._wokeRetry = true; // uma única re-tentativa
    return api(config);       // refaz a requisição original (mesmo corpo/headers)
  },
);

export default api;
