import { useEffect, useState } from 'react';
import { getBadges } from '../services/badgeService';

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

export function useBadges() {
  const [badges, setBadges] = useState(null); // null = carregando
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getBadges()
      .then((data) => {
        if (!active) return;
        setBadges((Array.isArray(data) ? data : []).map(mapBadge));
      })
      .catch((err) => {
        if (active) { setError(err); setBadges([]); }
      });
    return () => { active = false; };
  }, []);

  return { badges, loading: badges === null, error };
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
