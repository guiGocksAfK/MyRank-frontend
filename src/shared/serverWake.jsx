import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { API_URL } from '../services/api';
import { onServerDown, reportServerUp } from './serverStatus';
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

  // Enquanto acorda: conta o tempo e tenta a cada 5s. Quando o servidor volta,
  // esconde a tela e libera o interceptor pra refazer a requisição que falhou
  // (sem reload — o usuário não precisa refazer o login/ação).
  useEffect(() => {
    if (!waking) return;
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    const poll = setInterval(async () => {
      if (await probe()) {
        clearInterval(poll);
        clearInterval(tick);
        wakingRef.current = false;
        setWaking(false);
        reportServerUp();
      }
    }, POLL_MS);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
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
