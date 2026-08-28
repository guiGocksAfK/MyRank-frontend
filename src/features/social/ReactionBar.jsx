import { useState } from 'react';

const KINDS = [
  { id: 'up', icon: '👍', label: 'Curti' },
  { id: 'agree', icon: '🤝', label: 'Concordo' },
  { id: 'disagree', icon: '👎', label: 'Discordo' },
];

/**
 * Linha de reações de um card. `reactions` = { up, agree, disagree, mine }.
 * `onReact(kind)` deve devolver o objeto de reações atualizado (Promise ok).
 */
export default function ReactionBar({ reactions, onReact }) {
  const [state, setState] = useState(reactions);
  const [busy, setBusy] = useState(false);

  async function handle(kind) {
    if (busy) return;
    setBusy(true);
    // otimista
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
    <div className="mr-flex mr-items-center mr-gap-2" style={{ marginTop: 8, flexWrap: 'wrap' }}>
      {KINDS.map((k) => {
        const active = state.mine === k.id;
        const count = state[k.id] || 0;
        return (
          <button
            key={k.id}
            type="button"
            onClick={() => handle(k.id)}
            title={k.label}
            className="social-react-btn"
            data-active={active ? 'true' : undefined}
          >
            <span aria-hidden="true">{k.icon}</span>
            {count > 0 && <span className="social-react-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
