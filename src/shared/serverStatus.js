// Estado do back (Render free, com cold start) — sem React. É a única fonte de
// verdade: o interceptor do axios (api.js) espera por aqui e o
// ServerWakeProvider só assina pra mostrar/esconder a tela.
//
// Por que as requisições ESPERAM em vez de re-tentar sozinhas: enquanto o
// Render dorme ele segura as conexões sem responder. Toda chamada autenticada
// gera um preflight CORS (OPTIONS) e o navegador NÃO cancela o preflight quando
// o axios dá timeout. Re-tentar a cada 5s ia empilhando preflights pendurados
// até lotar as 6 conexões por host do Chrome — aí nem a sonda do /health saía
// do navegador, a tela nunca sumia e só fechando a aba liberava. Agora, com o
// servidor dormindo, nada além da sonda vai pra rede.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const HEALTH_URL = `${API_URL.replace(/\/+$/, '')}/health`;
const POLL_MS = 5000;
const PROBE_TIMEOUT_MS = 4500;
// Acordado, o /health responde em < 1s. Se a 1ª sonda passar disso, é cold start.
const FIRST_PROBE_GRACE_MS = 2500;

/** 'checking' (1ª sonda no ar) | 'up' | 'waking' */
let status = 'checking';
let wakingSince = 0;
let started = false;
let probing = false;
let pollTimer = null;
let waiters = [];
const listeners = new Set();

/** Bate no /health (GET simples, sem preflight). 503 = app subindo, banco ainda não pronto. */
async function probe() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(HEALTH_URL, { cache: 'no-store', signal: ctrl.signal });
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function setStatus(next) {
  if (status === next) return;
  status = next;
  if (next === 'waking') {
    wakingSince = Date.now();
    pollTimer = setInterval(checkNow, POLL_MS);
  } else {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (next === 'up') {
    const ready = waiters;
    waiters = [];
    ready.forEach((resolve) => resolve());
  }
  listeners.forEach((fn) => fn());
}

async function checkNow() {
  if (probing) return;
  probing = true;
  const up = await probe();
  probing = false;
  if (up) setStatus('up');
  else setStatus('waking');
}

function ensureStarted() {
  if (started) return;
  started = true;
  setTimeout(() => {
    if (status === 'checking') setStatus('waking');
  }, FIRST_PROBE_GRACE_MS);
  checkNow();

  // Aba em segundo plano tem o setInterval estrangulado pra ~1x/min; ao voltar
  // pra aba, testa na hora em vez de esperar o próximo tick.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && status === 'waking') checkNow();
  });
}

/**
 * Resolve quando dá pra mandar requisição. Enquanto a 1ª sonda está no ar
 * (`checking`) só segura quem pede `strict` — senão toda primeira carga com o
 * servidor acordado pagaria a latência da sonda.
 */
export function waitUntilUp({ strict = true } = {}) {
  ensureStarted();
  if (status === 'up' || (status === 'checking' && !strict)) return Promise.resolve();
  return new Promise((resolve) => waiters.push(resolve));
}

/** Chamado pelo interceptor quando uma requisição falha com cara de cold start. */
export function reportServerDown() {
  ensureStarted();
  if (status === 'waking') return;
  setStatus('waking');
  checkNow();
}

export function subscribeServerStatus(fn) {
  ensureStarted();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getServerStatus = () => status;
export const getWakingSince = () => wakingSince;
