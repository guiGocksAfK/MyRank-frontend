import { useState } from 'react';
import { Handshake, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';

/** Pra ser "polêmico": votos suficientes e nenhum lado com mais de 65%. */
const POLEMIC_MIN_VOTES = 6;
const POLEMIC_MIN_SHARE = 0.35;

/**
 * Reações de um take. `reactions` = { up, agree, disagree, mine }.
 * O curti fica só com ícone e número; concordo × discordo é o placar do take,
 * com o nome escrito, uma barrinha de quem está ganhando e o selo "polêmico"
 * quando está dividido. `onReact(kind)` devolve as reações atualizadas.
 */
export default function ReactionBar({ reactions, onReact }) {
  const { t } = useLanguage();
  const tr = t.social.react;
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

  const button = (kind, Icon, label, withText) => {
    const active = state.mine === kind;
    const count = state[kind] || 0;
    return (
      <button
        type="button"
        onClick={() => handle(kind)}
        className={`social-react-btn${withText ? ' has-text' : ''}`}
        data-active={active ? 'true' : undefined}
        aria-pressed={active}
        aria-label={label}
        title={label}
      >
        <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
        {withText && <span className="social-react-text">{label}</span>}
        {count > 0 && <span className="social-react-count">{count}</span>}
      </button>
    );
  };

  const votes = (state.agree || 0) + (state.disagree || 0);
  const agreeShare = votes ? state.agree / votes : 0;
  const polemic = votes >= POLEMIC_MIN_VOTES && Math.min(agreeShare, 1 - agreeShare) >= POLEMIC_MIN_SHARE;

  return (
    <div className="social-reactions">
      {button('up', ThumbsUp, tr.up, false)}
      <div className="social-verdict">
        {button('agree', Handshake, tr.agree, true)}
        {votes > 0 && (
          <span className="social-verdict-bar" aria-hidden="true">
            <span style={{ width: `${Math.round(agreeShare * 100)}%` }} />
          </span>
        )}
        {button('disagree', ThumbsDown, tr.disagree, true)}
      </div>
      {polemic && <span className="social-polemic">{tr.polemic}</span>}
    </div>
  );
}
