import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getBadges } from '../services/badgeService';
import { useUser } from './userContext';

export const BUCKET_META = {
  jogo:  { label: 'Jogos',  icon: '🎮' },
  filme: { label: 'Filmes', icon: '🎬' },
  serie: { label: 'Séries', icon: '📺' },
  livro: { label: 'Livros', icon: '📚' },
  anime: { label: 'Animes', icon: '🌸' },
  geral: { label: 'Gerais', icon: '🌐' },
  site:  { label: 'Usar o site', icon: '🚀' },
};

export const BUCKET_ORDER = ['jogo', 'filme', 'serie', 'livro', 'anime', 'geral', 'site'];

/** DTO do backend → shape usado pelos componentes de badge. */
function mapBadge(b) {
  return {
    id: b.code,
    bucket: b.bucket,
    name: b.name,
    description: b.description,
    icon: b.icon,
    unlocked: b.unlocked,
    progress: b.progress,
    maxProgress: b.target,
    hasProgress: b.hasProgress,
    unlockedAt: b.unlockedAt,
  };
}

/** Agrupa as badges por bucket, na ordem canônica. */
export function groupByBucket(badges = []) {
  return BUCKET_ORDER
    .map((key) => ({
      key,
      ...BUCKET_META[key],
      items: badges.filter((b) => b.bucket === key),
    }))
    .filter((g) => g.items.length > 0);
}

// ─────────────────────────────────────────────────────────────────────
// Contexto: uma única busca de /api/badges pra todo o dashboard +
// detecção de badges recém-conquistadas pra disparar o toast.
// ─────────────────────────────────────────────────────────────────────

const BadgeContext = createContext(null);

const seenKeyFor = (userId) => `myrank_seen_badges_${userId}`;

function readSeen(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeSeen(key, codes) {
  try {
    localStorage.setItem(key, JSON.stringify([...new Set(codes)]));
  } catch {
    /* modo privado / storage cheio — só perde a detecção, sem quebrar */
  }
}

export function BadgeProvider({ children }) {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [badges, setBadges] = useState(null); // null = carregando
  const [toasts, setToasts] = useState([]);
  const seededRef = useRef(false);

  const detectNew = useCallback(
    (mapped) => {
      if (!userId) return;
      const key = seenKeyFor(userId);
      const unlockedCodes = mapped.filter((b) => b.unlocked).map((b) => b.id);
      const seen = readSeen(key);

      // Primeira vez que vemos esse usuário: semeia sem notificar nada.
      if (seen === null) {
        writeSeen(key, unlockedCodes);
        seededRef.current = true;
        return;
      }

      const fresh = mapped.filter((b) => b.unlocked && !seen.includes(b.id));
      if (fresh.length > 0) {
        setToasts((prev) => [
          ...prev,
          ...fresh.map((b) => ({ key: `${b.id}-${Date.now()}`, badge: b })),
        ]);
      }
      writeSeen(key, [...seen, ...unlockedCodes]);
    },
    [userId],
  );

  const load = useCallback(async () => {
    try {
      const data = await getBadges();
      const mapped = (Array.isArray(data) ? data : []).map(mapBadge);
      setBadges(mapped);
      detectNew(mapped);
    } catch {
      setBadges((prev) => prev ?? []);
    }
  }, [detectNew]);

  useEffect(() => {
    if (userId) load();
  }, [userId, load]);

  const dismissToast = useCallback((key) => {
    setToasts((prev) => prev.filter((t) => t.key !== key));
  }, []);

  const value = {
    badges,
    loading: badges === null,
    refresh: load,
  };

  return (
    <BadgeContext.Provider value={value}>
      {children}
      <BadgeToaster toasts={toasts} onDismiss={dismissToast} />
    </BadgeContext.Provider>
  );
}

export function useBadges() {
  return (
    useContext(BadgeContext) ?? {
      badges: null,
      loading: true,
      refresh: async () => {},
    }
  );
}

// ─────────────────────────────────────────────────────────────────────
// Toast de conquista
// ─────────────────────────────────────────────────────────────────────

function BadgeToaster({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 'min(360px, calc(100vw - 32px))',
      }}
    >
      {toasts.map((t) => (
        <BadgeToast key={t.key} badge={t.badge} onClose={() => onDismiss(t.key)} />
      ))}
    </div>
  );
}

function BadgeToast({ badge, onClose }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), 6000);
    const kill = setTimeout(onClose, 6400);
    return () => {
      clearTimeout(hide);
      clearTimeout(kill);
    };
  }, [onClose]);

  return (
    <div
      role="status"
      onClick={onClose}
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 12,
        background: 'var(--mr-surface)',
        border: '1px solid rgba(201,162,39,0.45)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(201,162,39,0.15)',
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      <span style={{ fontSize: '1.9rem', lineHeight: 1, flexShrink: 0 }}>{badge.icon}</span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--mr-gold)',
          }}
        >
          🏅 Conquista desbloqueada
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>{badge.name}</div>
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--mr-text-secondary)',
            marginTop: 2,
            lineHeight: 1.35,
          }}
        >
          {badge.description}
        </div>
      </div>
    </div>
  );
}
