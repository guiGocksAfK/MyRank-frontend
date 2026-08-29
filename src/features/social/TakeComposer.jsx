import { useMemo, useState } from 'react';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { typeIconFor } from './socialData';

const MAX = 280;

/**
 * Compositor de "take": escolhe uma obra sua (dados reais de /works/unified)
 * e escreve uma opinião curta. `onPost({ work, text })`.
 */
export default function TakeComposer({ onPost }) {
  const { items, loading } = useUnifiedItems();
  const [workKey, setWorkKey] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

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
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="social-card" style={{ alignItems: 'stretch' }}>
      <div className="mr-min-w-0" style={{ flex: 1 }}>
        <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap" style={{ marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>✍️ Escrever um take</span>
          <select
            className="mr-input social-select"
            value={workKey}
            onChange={(e) => setWorkKey(e.target.value)}
            disabled={loading || works.length === 0}
            style={{ maxWidth: 260 }}
          >
            <option value="">
              {loading
                ? 'carregando suas obras…'
                : works.length === 0
                  ? 'você ainda não avaliou nada'
                  : 'sobre qual obra?'}
            </option>
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
          placeholder={chosen ? `Sua opinião sobre ${chosen.title}…` : 'Escolha uma obra acima…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!chosen}
          style={{ width: '100%', resize: 'vertical' }}
        />

        <div className="mr-flex mr-items-center mr-justify-between" style={{ marginTop: 8 }}>
          <span
            className="social-muted"
            style={{ color: remaining < 0 ? '#e24b4a' : undefined, fontVariantNumeric: 'tabular-nums' }}
          >
            {remaining}
          </span>
          <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={submit} disabled={!canPost}>
            {busy ? 'Postando…' : 'Postar take'}
          </button>
        </div>
      </div>
    </div>
  );
}
