/**
 * Texto de erro para a tela: a mensagem do servidor (que já vem no idioma da pessoa e
 * explica o problema) ou, sem ela, a reserva da própria tela. Nunca o erro cru do
 * navegador ("Network Error", "Request failed with status code 500").
 */
export function errorText(err, fallback) {
  if (err?.userFacing && err.message) return err.message;
  const message = err?.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

/**
 * Erro com texto já pronto para a tela, para repassar a quem mostra (ex.: o
 * ConfirmModal): lá, errorText devolve este texto em vez da reserva genérica.
 */
export function userError(text, cause) {
  const error = new Error(text, { cause });
  error.userFacing = true;
  return error;
}
