import axios from "axios";
import { reportServerDown, waitUntilUp } from "../shared/serverStatus";

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

const isExternal = (url = "") => url.includes("/external/");

api.interceptors.request.use(async (config) => {
  // Com o servidor dormindo nada sai daqui até ele acordar (ver serverStatus.js).
  // /external/* (pôsteres do hero, autocomplete) tem fallback próprio e não
  // espera a 1ª sonda.
  await waitUntilUp({ strict: !isExternal(config.url) });
  const token = localStorage.getItem("myrank_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Poucas: cada retentativa já espera o servidor acordar antes de sair.
const WAKE_MAX_RETRIES = 3;

// Cold start do Render (plano free): sem resposta, timeout ou 502/503/504.
// Nesse caso mostra a tela de "acordando o servidor", espera o /health
// confirmar que o back (e o banco) subiram e REFAZ a mesma requisição — o
// await de quem chamou (ex.: loginWithGoogle) resolve normalmente, sem o
// usuário refazer nada.
//
// 4xx (login errado, etc.) NÃO conta. /external/* não dispara a tela.
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

    const retryCount = config?._wokeRetryCount || 0;

    if (
      !looksAsleep ||
      !config ||
      retryCount >= WAKE_MAX_RETRIES ||
      isExternal(url)
    ) {
      return Promise.reject(error);
    }

    reportServerDown();                    // mostra a tela e começa a sondar o /health
    config._wokeRetryCount = retryCount + 1;
    return api(config);                    // o interceptor de request segura até o servidor acordar
  },
);

export default api;
