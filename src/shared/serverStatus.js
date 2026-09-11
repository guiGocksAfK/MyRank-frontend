// Ponte sem React entre o interceptor do axios (api.js) e o ServerWakeProvider.
// O interceptor não pode importar React/estado, então coordena por aqui.

let downHandler = null;

/** O provider registra quem quer ser avisado quando o back parece fora do ar. */
export function onServerDown(fn) {
  downHandler = fn;
  return () => {
    if (downHandler === fn) downHandler = null;
  };
}

/** Chamado pelo interceptor quando uma requisição falha por cold start / timeout. */
export function reportServerDown() {
  downHandler?.();
}
