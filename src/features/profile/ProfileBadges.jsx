import { useState } from 'react';
import Modal from '../../shared/components/Modal';
import BadgeIcon from '../../shared/badgeIcons';
import { useLanguage } from '../../shared/i18n';
import { groupByBucket } from '../../shared/badges';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

const pctOf = (b) => Math.min(100, Math.round((b.progress / Math.max(b.maxProgress, 1)) * 100));

const filterBadges = (badges, filter) => (
  filter === 'unlocked' ? badges.filter((b) => b.unlocked)
    : filter === 'locked' ? badges.filter((b) => !b.unlocked)
      : badges
);

/** Barra geral + filtro, compactos, na linha das abas. */
export function BadgeSummary({ badges, filter, onFilter }) {
  const { t } = useLanguage();
  const tp = t.profile;
  const unlocked = badges.filter((b) => b.unlocked).length;
  const pct = Math.round((unlocked / Math.max(badges.length, 1)) * 100);

  return (
    <div className="pf-summary">
      <div className="pf-summary-progress" title={`${pct}%`}>
        <span className="pf-summary-label">{fmt(tp.unlockedShort, { n: unlocked, m: badges.length })}</span>
        <span className="pf-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      </div>
      <div className="rk-seg" role="group" aria-label={tp.tabBadges}>
        {[
          { id: 'all', label: tp.filterAll },
          { id: 'unlocked', label: tp.filterUnlocked },
          { id: 'locked', label: tp.filterLocked },
        ].map((f) => (
          <button key={f.id} type="button" className={filter === f.id ? 'is-active' : ''}
            aria-pressed={filter === f.id} onClick={() => onFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Aba Conquistas: um cartão por tipo, os cartões preenchendo a largura.
 * Dentro, ícone + nome sem moldura: o dourado das desbloqueadas é o destaque;
 * as bloqueadas ficam apagadas, com o tracinho de progresso quando tem.
 * Clicar abre o detalhe (descrição, progresso ou data).
 */
export default function ProfileBadges({ badges, loading, filter }) {
  const { t } = useLanguage();
  const tp = t.profile;
  const [open, setOpen] = useState(null);

  if (loading) return <p className="pf-muted">{tp.loadingBadges}</p>;

  const groups = groupByBucket(filterBadges(badges, filter));
  if (groups.length === 0) return <p className="pf-empty">{tp.noBadgesFilter}</p>;

  // o "1/6" do cartão conta o tipo inteiro, não só o que o filtro mostra
  const totals = Object.fromEntries(groupByBucket(badges).map((g) => [
    g.key, `${g.items.filter((b) => b.unlocked).length}/${g.items.length}`,
  ]));

  return (
    <section className="pf-badge-groups">
      {groups.map((group) => (
        <div key={group.key} className="mr-panel pf-badge-card">
          <h3 className="pf-group-title">
            {t.common.badgeBuckets[group.key] || group.label}
            <span>{totals[group.key]}</span>
          </h3>
          <div className="pf-badge-grid">
            {group.items.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`pf-badge${b.unlocked ? ' is-unlocked' : ''}`}
                onClick={() => setOpen(b)}
                title={b.description}
              >
                <span className="pf-badge-icon"><BadgeIcon code={b.id} size={20} /></span>
                <span className="pf-badge-name">{b.name}</span>
                {!b.unlocked && b.hasProgress && (
                  <span className="pf-badge-track" aria-hidden="true">
                    <span style={{ width: `${pctOf(b)}%` }} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {open && <BadgeDetail badge={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

function BadgeDetail({ badge, onClose }) {
  const { t, locale } = useLanguage();
  const tp = t.profile;
  const date = badge.unlockedAt
    ? new Date(badge.unlockedAt).toLocaleDateString(locale || 'pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <Modal title={badge.name} onClose={onClose} width={380}>
      <div className="pf-detail">
        <span className={`pf-detail-icon${badge.unlocked ? ' is-unlocked' : ''}`}>
          <BadgeIcon code={badge.id} size={34} />
        </span>
        <p className="pf-detail-desc">{badge.description}</p>

        {badge.unlocked ? (
          <p className="pf-detail-status is-unlocked">{date ? fmt(tp.badgeUnlockedOn, { date }) : tp.badgeUnlocked}</p>
        ) : badge.hasProgress ? (
          <div className="pf-detail-progress">
            <div className="pf-badge-track is-lg" aria-hidden="true"><span style={{ width: `${pctOf(badge)}%` }} /></div>
            <p className="pf-detail-status">{fmt(tp.badgeProgress, { n: badge.progress, m: badge.maxProgress })}</p>
          </div>
        ) : (
          <p className="pf-detail-status">{tp.badgeLocked}</p>
        )}
      </div>
    </Modal>
  );
}
