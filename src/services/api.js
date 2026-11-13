import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let redirectingToLogin = false;

/**
 * 401 numa requisição fora de /auth = a sessão caiu (venceu ou foi encerrada
 * por uma troca de senha em outro aparelho). Limpa o login e manda pra /entrar,
 * em vez de deixar a tela quebrada. As rotas de /auth ficam de fora: lá o 401 é
 * resposta normal (ex.: senha errada) e a própria tela mostra a mensagem.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRoute && !redirectingToLogin) {
      redirectingToLogin = true;
      // mesmas chaves do logout() do authService; importar de lá daria import circular
      localStorage.removeItem("myrank_token");
      localStorage.removeItem("myrank_username");
      window.location.assign("/entrar");
    }
    return Promise.reject(error);
  }
);

export default api;
