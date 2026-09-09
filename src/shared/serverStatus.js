// Ponte sem React entre o interceptor do axios (api.js) e o ServerWakeProvider.
// O interceptor não pode importar React/estado, então coordena por aqui.

let downHandler = null;
let upResolvers = [];
let serverDown = false;

/** O provider registra quem quer ser avisado quando o back parece fora do ar. */
export function onServerDown(fn) {
  downHandler = fn;
  return () => {
    if (downHandler === fn) downHandler = null;
  };
}

/** Chamado pelo interceptor quando uma requisição falha por cold start / timeout. */
export function reportServerDown() {
  serverDown = true;
  downHandler?.();
}

/**
 * Chamado pelo provider quando o /health volta a responder.
 * Libera todas as requisições que estavam esperando pra re-tentar.
 */
export function reportServerUp() {
  serverDown = false;
  const resolvers = upResolvers;
  upResolvers = [];
  resolvers.forEach((resolve) => resolve());
}

/**
 * O interceptor espera nisto antes de refazer a requisição que falhou.
 * Resolve na hora se o servidor não está marcado como fora do ar.
 */
export function whenServerUp() {
  if (!serverDown) return Promise.resolve();
  return new Promise((resolve) => upResolvers.push(resolve));
}
