// Ponte sem React entre o interceptor do axios (api.js) e o ServerWakeProvider.
// O interceptor não pode importar React/estado, então avisa por aqui.

let handler = null;

/** O provider registra quem quer ser avisado quando o back parece fora do ar. */
export function onServerDown(fn) {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

/** Chamado pelo interceptor quando uma requisição falha por cold start / timeout. */
export function reportServerDown() {
  handler?.();
}
