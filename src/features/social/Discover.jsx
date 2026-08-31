import { useEffect, useState } from 'react';
import { socialApi } from './socialData';
import { useLanguage } from '../../shared/i18n';
import UserPill from './UserPill';
import SocialEmpty from './SocialEmpty';

export default function Discover({ onOpenUser, onFollowChange }) {
  const { t } = useLanguage();
  const td = t.social.discover;
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
  const heading = results
    ? td.results.replace('{n}', results.length)
    : td.suggestions;

  return (
    <section className="social-disc-card">
      <div className="social-disc-head">
        <div className="social-disc-title"><span aria-hidden="true">👥</span> {td.peopleTitle}</div>
      </div>

      <div className="social-disc-searchwrap">
        <span aria-hidden="true">🔍</span>
        <input
          className="social-disc-search"
          placeholder={td.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="social-disc-subhead">{heading}</div>

      <div className="social-disc-body">
        {list.length === 0 ? (
          <SocialEmpty icon="🔍" text={results ? td.noneFound : td.noSuggestions} />
        ) : (
          <div className="mr-space-y-2">
            {list.map((u) => (
              <UserPill key={u.id} user={u} onToggleFollow={handleFollow} onOpen={onOpenUser} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
