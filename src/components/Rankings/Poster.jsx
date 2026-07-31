import React from 'react';

export default function Poster({ src, title, size = 'thumb' }) {
  const dimensions = size === 'thumb' ? { w: 36, h: 54 } : { w: 200, h: 300 };
  const placeholder = (
    <div style={{
      width: dimensions.w, height: dimensions.h,
      borderRadius: size === 'thumb' ? 4 : 8,
      background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size === 'thumb' ? '1rem' : '3rem',
      color: 'var(--mr-text-secondary)',
    }}>🎬</div>
  );

  if (!src) return placeholder;

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
      style={{
        width: dimensions.w, height: dimensions.h,
        borderRadius: size === 'thumb' ? 4 : 8,
        objectFit: 'cover', border: '1px solid var(--mr-border)',
      }}
    />
  );
}