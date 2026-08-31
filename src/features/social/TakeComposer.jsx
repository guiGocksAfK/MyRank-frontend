import { useMemo, useState } from 'react';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useLanguage } from '../../shared/i18n';
import { typeIconFor } from './socialData';

const MAX = 280;
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/**
 * Compositor de "take": escolhe uma obra sua (dados reais de /works/unified)
 * e escreve uma opinião curta. `onPost({ work, text })`.
 * Colapsado por padrão; sem obras avaliadas vira um card de onboarding.
 */
export default function TakeComposer({ onPost, onNavigate }) {
  const { items, loading } = useUnifiedItems();
  const { t } = useLanguage();
  const tc = t.social.composer;
  const [workKey, setWorkKey] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const works = useMemo(
    () =>
      (items || [])
        .slice()
        .sort((a, b) => (a.title || '').localeCompare(b.title || '')),
    [items],
  );

  const chosen = works.find((w) => String(w.id) === workKey);
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
      setWorkKey('');
      setExpanded(false);
    } finally {
      setBusy(false);
    }
  }

  // Sem obras avaliadas → onboarding
  if (!loading && works.length === 0) {
    return (
      <div className="mr-card social-onboard">
        <div className="mr-card-body">
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
        className="social-composer-collapsed"
        onClick={() => setExpanded(true)}
        disabled={loading}
      >
        <span aria-hidden="true">✍️</span>
        {loading ? tc.loadingWorks : tc.collapsedPrompt}
      </button>
    );
  }

  return (
    <div className="mr-card">
      <div className="mr-card-body">
        <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap" style={{ marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tc.title}</span>
          <select
            className="mr-input social-select"
            value={workKey}
            onChange={(e) => setWorkKey(e.target.value)}
            disabled={works.length === 0}
            style={{ maxWidth: 260 }}
          >
            <option value="">{works.length === 0 ? tc.noWorks : tc.whichWork}</option>
            {works.map((w) => (
              <option key={w.id} value={String(w.id)}>
                {typeIconFor(w.type)} {w.title}
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="mr-input"
          rows={2}
          maxLength={MAX + 20}
          placeholder={chosen ? fmt(tc.placeholderChosen, { title: chosen.title }) : tc.placeholderEmpty}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!chosen}
          autoFocus
          style={{ width: '100%', resize: 'vertical' }}
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
                setWorkKey('');
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
