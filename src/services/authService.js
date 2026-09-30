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

/** Token do link do email de confirmação; o backend já devolve a sessão. */
export const verifyEmail = async (token) => {
  const response = await api.post("/auth/verify-email", { token });
  saveAuthResponse(response.data);
  return response.data;
};

export const resendVerification = async (email) => {
  await api.post("/auth/resend-verification", { email });
};

/** Cadastro, etapa 1: manda o código de 6 dígitos pro email. */
export const sendSignupCode = async (email, language) => {
  await api.post("/auth/signup/code", { email, language });
};

/** Cadastro, etapa 2: confere o código e devolve o passe que libera a etapa 3. */
export const verifySignupCode = async (email, code) => {
  const response = await api.post("/auth/signup/verify", { email, code });
  return response.data.signupPass;
};

/** Cadastro, etapa 3: cria a conta (email vem do passe) e já entra. */
export const register = async ({ signupPass, username, password, language }) => {
  const response = await api.post("/users", { signupPass, username, password, language });
  saveAuthResponse(response.data);
  return response.data;
};

/** "Esqueci minha senha": { status: "SENT" | "SOCIAL", provider: "GOOGLE" | "DISCORD" | null } */
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

/** Link do email de redefinição + senha nova. */
export const resetPassword = async (token, password) => {
  await api.post("/auth/reset-password", { token, password });
};

/** Login com senha recusado só porque a conta ainda não confirmou o email. */
export const isEmailNotVerifiedError = (err) =>
  err?.response?.status === 403 && err.response.data?.code === "EMAIL_NOT_VERIFIED";

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
    state: createDiscordState(),
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
};

const DISCORD_STATE_KEY = "myrank_discord_oauth_state";

/**
 * `state` do OAuth: valor aleatório guardado nesta aba e conferido na volta. Sem
 * ele, um link com o access_token da conta de outra pessoa logaria a vítima na
 * conta do atacante (login CSRF).
 */
function createDiscordState() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem(DISCORD_STATE_KEY, state);
  return state;
}

/** Confere o `state` que voltou do Discord e descarta o guardado (só vale uma vez). */
export const consumeDiscordState = (returnedState) => {
  let expected = null;
  try {
    expected = sessionStorage.getItem(DISCORD_STATE_KEY);
    sessionStorage.removeItem(DISCORD_STATE_KEY);
  } catch {
    /* storage bloqueado: expected fica null e o login é recusado */
  }
  return !!expected && !!returnedState && expected === returnedState;
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
