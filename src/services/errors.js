/**
 * Texto de erro para a tela: a mensagem do servidor (que já vem no idioma da pessoa e
 * explica o problema) ou, sem ela, a reserva da própria tela. Nunca o erro cru do
 * navegador ("Network Error", "Request failed with status code 500").
 */
export function errorText(err, fallback) {
  const message = err?.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}
