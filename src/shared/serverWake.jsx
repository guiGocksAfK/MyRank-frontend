import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  getServerStatus,
  getWakingSince,
  subscribeServerStatus,
} from './serverStatus';
import { useLanguage } from './i18n';

const RETRY_HINT_AT = 90; // segundos até oferecer o botão de recarregar manual

const ServerWakeContext = createContext({ waking: false });
export const useServerWake = () => useContext(ServerWakeContext);

/**
 * Só apresenta: quem decide se o servidor está dormindo, sonda o /health e
 * segura as requisições é o serverStatus.js (também usado pelo axios).
 */
export function ServerWakeProvider({ children }) {
  const waking =
    useSyncExternalStore(subscribeServerStatus, getServerStatus) === 'waking';

  return (
    <ServerWakeContext.Provider value={{ waking }}>
      {children}
      {waking && <ServerWakeOverlay />}
    </ServerWakeContext.Provider>
  );
}

const elapsedSeconds = () =>
  Math.max(0, Math.floor((Date.now() - getWakingSince()) / 1000));

function ServerWakeOverlay() {
  const { t } = useLanguage();
  const s = t.common.serverWake;
  // Conta pelo relógio (não por ticks) — aba em segundo plano atrasa o setInterval.
  const [seconds, setSeconds] = useState(elapsedSeconds);

  useEffect(() => {
    const tick = setInterval(() => setSeconds(elapsedSeconds()), 1000);
    return () => clearInterval(tick);
  }, []);

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
