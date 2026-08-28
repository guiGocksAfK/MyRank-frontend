import { useEffect, useState } from 'react';
import { socialApi } from './socialData';
import UserPill from './UserPill';

export default function Discover({ onOpenUser, onFollowChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    socialApi.getSuggestions().then(setSuggestions);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    let active = true;
    const t = setTimeout(() => {
      socialApi.searchUsers(q).then((r) => active && setResults(r));
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const handleFollow = async (id) => {
    const updated = await socialApi.toggleFollow(id);
    setSuggestions((prev) => prev.filter((u) => u.id !== id || !updated.following));
    onFollowChange?.();
    return updated;
  };

  const list = results ?? suggestions;
  const heading = results ? `Resultados (${results.length})` : 'Sugestões pra você';

  return (
    <div className="mr-space-y-4">
      <input
        className="mr-input"
        placeholder="Buscar por nome ou @handle…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%' }}
      />

      <div className="social-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
        {heading}
      </div>

      {list.length === 0 ? (
        <div className="social-empty">
          {results ? 'Ninguém encontrado com esse nome.' : 'Sem sugestões no momento.'}
        </div>
      ) : (
        <div className="mr-space-y-2">
          {list.map((u) => (
            <UserPill key={u.id} user={u} onToggleFollow={handleFollow} onOpen={onOpenUser} />
          ))}
        </div>
      )}
    </div>
  );
}
