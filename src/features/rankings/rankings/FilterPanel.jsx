import React from 'react';
import { useLanguage } from '../../../shared/i18n';

export default function FilterPanel({ filters, onChange, onClear, resultCount }) {
  const { t } = useLanguage();
  const tf = t.rankings.filterPanel;
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const inputStyle = {
    width: 80, padding: '5px 8px', borderRadius: 6,
    border: '1px solid var(--mr-border)', background: 'var(--mr-bg)',
    color: 'var(--mr-text)', fontSize: '0.8rem',
  };

  const labelStyle = {
    fontSize: '0.7rem', color: 'var(--mr-text-secondary)',
    display: 'block', marginBottom: 3,
  };

  return (
    <div style={{
      padding: '1rem', borderRadius: 8, marginBottom: '1rem',
      background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
    }}>
      <div className="mr-flex mr-items-center mr-justify-between mr-mb-3">
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{tf.heading}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
          {(resultCount === 1 ? tf.resultsOne : tf.resultsMany).replace('{n}', resultCount)}
        </span>
      </div>

      <div className="mr-flex mr-flex-wrap mr-gap-4">
        <div>
          <label style={labelStyle}>{tf.yearRange}</label>
          <div className="mr-flex mr-items-center mr-gap-1">
            <input
              type="number" placeholder="1900" value={filters.releaseYearMin ?? ''}
              onChange={e => update('releaseYearMin', e.target.value ? parseInt(e.target.value, 10) : null)}
              style={inputStyle}
            />
            <span style={{ color: 'var(--mr-text-secondary)' }}>—</span>
            <input
              type="number" placeholder="2026" value={filters.releaseYearMax ?? ''}
              onChange={e => update('releaseYearMax', e.target.value ? parseInt(e.target.value, 10) : null)}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{tf.addedBetween}</label>
          <div className="mr-flex mr-items-center mr-gap-1">
            <input
              type="date" value={filters.addedDateFrom ?? ''}
              onChange={e => update('addedDateFrom', e.target.value || null)}
              style={{ ...inputStyle, width: 130 }}
            />
            <span style={{ color: 'var(--mr-text-secondary)' }}>—</span>
            <input
              type="date" value={filters.addedDateTo ?? ''}
              onChange={e => update('addedDateTo', e.target.value || null)}
              style={{ ...inputStyle, width: 130 }}
            />
          </div>
        </div>

        <div className="mr-flex mr-items-end">
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClear}>
            {tf.clear}
          </button>
        </div>
      </div>
    </div>
  );
}