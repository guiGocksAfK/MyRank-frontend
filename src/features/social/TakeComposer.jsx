import { useRef, useState } from 'react';
import { PenLine } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import { useUser } from '../../shared/userContext';
import SocialAvatar from './SocialAvatar';
import WorkPicker from './WorkPicker';

const MAX = 280;
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/**
 * Compositor de "take": escolhe uma obra sua (dados reais de /works/unified)
 * e escreve uma opinião curta. `onPost({ work, text })`.
 * Colapsado por padrão; sem obras avaliadas vira um card de onboarding.
 */
/** `items`: suas obras (null = carregando), vindas do feed pra não buscar duas vezes. */
export default function TakeComposer({ items, onPost, onNavigate }) {
  const loading = items === null;
  const { t } = useLanguage();
  const { user } = useUser();
  const tc = t.social.composer;
  const [chosen, setChosen] = useState(null);
  const textRef = useRef(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const works = items || [];
  const remaining = MAX - text.length;
  const canPost = chosen && text.trim().length >= 3 && remaining >= 0 && !busy;

  async function submit() {
    if (!canPost) return;
    setBusy(true);
    try {
      await onPost({
        workId: chosen.id,
        text,
        work: {
          title: chosen.title,
          type: chosen.type || 'outro',
          score: Number(chosen.note) || null,
        },
      });
      setText('');
      setChosen(null);
      setExpanded(false);
    } finally {
      setBusy(false);
    }
  }

  // Sem obras avaliadas → onboarding
  if (!loading && works.length === 0) {
    return (
      <div className="mr-panel social-composer social-onboard">
        <div>
          <div className="social-onboard-title">{tc.onboardTitle}</div>
          <p className="social-onboard-text">{tc.onboardText}</p>
          <button
            type="button"
            className="mr-btn mr-btn-gold mr-btn-sm"
            onClick={() => onNavigate?.('rankings')}
          >
            {tc.onboardCta}
          </button>
        </div>
      </div>
    );
  }

  // Colapsado
  if (!expanded) {
    return (
      <button
        type="button"
        className="mr-panel social-composer-collapsed"
        onClick={() => setExpanded(true)}
        disabled={loading}
      >
        <SocialAvatar name={user?.username || '?'} src={user?.avatarUrl} size={32} />
        <span className="social-composer-prompt">{loading ? tc.loadingWorks : tc.collapsedPrompt}</span>
        <span className="social-composer-cta">
          <PenLine size={14} strokeWidth={2} aria-hidden="true" />
          {tc.write}
        </span>
      </button>
    );
  }

  return (
    <div className="mr-panel social-composer">
      <div>
        <div className="social-composer-title">{tc.title}</div>
        <WorkPicker
          works={works}
          value={chosen}
          onChange={(w) => {
            setChosen(w);
            // escolheu a obra: o cursor já vai pro texto
            if (w) requestAnimationFrame(() => textRef.current?.focus());
          }}
        />

        <textarea
          ref={textRef}
          className="mr-input"
          rows={2}
          maxLength={MAX + 20}
          placeholder={chosen ? fmt(tc.placeholderChosen, { title: chosen.title }) : tc.placeholderEmpty}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!chosen}
          style={{ width: '100%', resize: 'vertical', marginTop: 8 }}
        />

        <div className="mr-flex mr-items-center mr-justify-between" style={{ marginTop: 8 }}>
          <span
            className="social-muted"
            style={{ color: remaining < 0 ? 'var(--mr-red)' : undefined, fontVariantNumeric: 'tabular-nums' }}
          >
            {text.length}/{MAX}
          </span>
          <div className="mr-flex mr-gap-2">
            <button
              type="button"
              className="mr-btn mr-btn-outline mr-btn-sm"
              onClick={() => {
                setExpanded(false);
                setText('');
                setChosen(null);
              }}
            >
              {tc.cancel}
            </button>
            <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={submit} disabled={!canPost}>
              {busy ? tc.posting : tc.post}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
