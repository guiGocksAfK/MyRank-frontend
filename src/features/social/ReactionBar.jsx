import { useState } from 'react';
import { useLanguage } from '../../shared/i18n';

/**
 * Linha de reações de um card. `reactions` = { up, agree, disagree, mine }.
 * `onReact(kind)` deve devolver o objeto de reações atualizado (Promise ok).
 */
export default function ReactionBar({ reactions, onReact }) {
  const { t } = useLanguage();
  const KINDS = [
    { id: 'up', icon: '👍', label: t.social.react.up },
    { id: 'agree', icon: '🤝', label: t.social.react.agree },
    { id: 'disagree', icon: '👎', label: t.social.react.disagree },
  ];
  const [state, setState] = useState(reactions);
  const [busy, setBusy] = useState(false);

  async function handle(kind) {
    if (busy) return;
    setBusy(true);
    const prev = state;
    const next = { ...prev };
    if (next.mine === kind) {
      next[kind] = Math.max(0, next[kind] - 1);
      next.mine = null;
    } else {
      if (next.mine) next[next.mine] = Math.max(0, next[next.mine] - 1);
      next[kind] += 1;
      next.mine = kind;
    }
    setState(next);
    try {
      const server = await onReact(kind);
      if (server) setState(server);
    } catch {
      setState(prev);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="social-reactions">
      {KINDS.map((k) => {
        const active = state.mine === k.id;
        const count = state[k.id] || 0;
        return (
          <button
            key={k.id}
            type="button"
            onClick={() => handle(k.id)}
            className="social-react-btn"
            data-active={active ? 'true' : undefined}
          >
            <span aria-hidden="true">{k.icon}</span>
            <span className="social-react-label">{k.label}</span>
            {count > 0 && <span className="social-react-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
