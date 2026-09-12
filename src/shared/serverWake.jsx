import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { API_URL } from '../services/api';
import { onServerDown } from './serverStatus';
import { useLanguage } from './i18n';

const HEALTH_URL = `${API_URL.replace(/\/+$/, '')}/health`;
const POLL_MS = 5000;
const PROBE_TIMEOUT_MS = 4500;
const RETRY_HINT_AT = 90; // segundos até oferecer o botão de recarregar manual

/** Bate no /health. Qualquer resposta HTTP (até 404) = servidor no ar. */
async function probe() {
  try {
    const res = await fetch(HEALTH_URL, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return res.status > 0 && res.status < 500;
  } catch {
    return false;
  }
}

const ServerWakeContext = createContext({ waking: false });
export const useServerWake = () => useContext(ServerWakeContext);

export function ServerWakeProvider({ children }) {
  const [waking, setWaking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const wakingRef = useRef(false);

  const startWaking = useCallback(() => {
    if (wakingRef.current) return;
    wakingRef.current = true;
    setSeconds(0);
    setWaking(true);
  }, []);

  // Além do aviso do interceptor (quando uma requisição de verdade falha),
  // já testa o /health assim que o site abre: se o back estiver dormindo
  // (hospedagem gratuita no Render), acorda e mostra a tela na hora, sem
  // esperar o usuário disparar alguma ação que vá falhar primeiro.
  useEffect(() => onServerDown(startWaking), [startWaking]);

  useEffect(() => {
    let cancelled = false;
    probe().then((up) => {
      if (!up && !cancelled) startWaking();
    });
    return () => {
      cancelled = true;
    };
  }, [startWaking]);

  // Enquanto acorda: conta o tempo e sonda o /health a cada 5s só pra saber
  // quando esconder a tela. A requisição que falhou de verdade já está sendo
  // re-tentada por conta própria no interceptor do axios (api.js), então essa
  // sonda aqui não precisa avisar mais ninguém.
  useEffect(() => {
    if (!waking) return;
    let checking = false;
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);

    const checkNow = async () => {
      if (checking) return;
      checking = true;
      try {
        if (await probe()) {
          clearInterval(poll);
          clearInterval(tick);
          wakingRef.current = false;
          setWaking(false);
        }
      } finally {
        checking = false;
      }
    };

    const poll = setInterval(checkNow, POLL_MS);

    // Navegadores jogam o setInterval de abas em segundo plano pra só 1x/min —
    // se o usuário sair da aba (ex.: ir checar o painel do banco) enquanto
    // espera, a sondagem quase para. Ao voltar pra aba, testa na hora em vez
    // de esperar o próximo tick throttled.
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkNow();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [waking]);

  return (
    <ServerWakeContext.Provider value={{ waking }}>
      {children}
      {waking && <ServerWakeOverlay seconds={seconds} />}
    </ServerWakeContext.Provider>
  );
}

function ServerWakeOverlay({ seconds }) {
  const { t } = useLanguage();
  const s = t.common.serverWake;
  return (
    <div className="mr-wake" role="status" aria-live="polite">
      <div className="mr-wake-card">
        <div className="mr-wake-spinner" aria-hidden="true" />
        <h2 className="mr-wake-title">{s.title}</h2>
        <p className="mr-wake-sub">{s.subtitle}</p>
        <p className="mr-wake-elapsed">
          {seconds < 45 ? s.elapsed.replace('{s}', seconds) : s.stillWorking}
        </p>
        {seconds >= RETRY_HINT_AT && (
          <button
            type="button"
            className="mr-wake-retry"
            onClick={() => window.location.reload()}
          >
            {s.retry}
          </button>
        )}
      </div>
    </div>
  );
}
