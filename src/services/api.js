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

const WAKE_RETRY_DELAY_MS = 5000;
const WAKE_MAX_RETRIES = 12; // ~1min de tentativas antes de desistir

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cold start do Render (plano free): sem resposta, timeout ou 502/503/504.
// Nesse caso mostra a tela de "acordando o servidor" e REFAZ a mesma
// requisição a cada 5s até ela dar certo (ou estourar o teto de tentativas) —
// o await de quem chamou (ex.: loginWithGoogle) resolve normalmente, sem o
// usuário refazer nada.
//
// Repara na própria chamada que falhou, não num /health separado: o /health
// é um endpoint burro que responde 200 assim que o processo sobe, antes do
// banco/JPA estarem prontos — então ele podia dar "servidor acordado" um
// pouco antes da aplicação de verdade conseguir atender, e a única
// retentativa que existia antes caía bem nessa janela e falhava de novo sem
// tentar mais.
//
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

    const retryCount = config?._wokeRetryCount || 0;

    if (
      !looksAsleep ||
      !config ||
      retryCount >= WAKE_MAX_RETRIES ||
      url.includes("/external/")
    ) {
      return Promise.reject(error);
    }

    reportServerDown();                    // mostra a tela de carregamento
    config._wokeRetryCount = retryCount + 1;
    await sleep(WAKE_RETRY_DELAY_MS);
    return api(config);                    // refaz a mesma requisição; se falhar de novo, cai aqui de novo
  },
);

export default api;
