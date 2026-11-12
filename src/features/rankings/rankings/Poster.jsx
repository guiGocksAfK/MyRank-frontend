import { useState } from 'react';
import { TEMPLATE_ICONS } from '../../../shared/tableTemplates';

export default function Poster({ src, title, template = 'movie', size = 'thumb' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const dimensions = size === 'thumb' ? { w: 36, h: 54 } : { w: 200, h: 300 };
  const Icon = TEMPLATE_ICONS[template] ?? TEMPLATE_ICONS.movie;
  const placeholder = (
    <div
      className={`mr-poster-image mr-poster-image-${size}`}
      aria-hidden="true"
      style={{
        width: dimensions.w, height: dimensions.h,
        borderRadius: size === 'thumb' ? 4 : 8,
        background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--mr-text-muted)',
      }}
    >
      <Icon size={size === 'thumb' ? 16 : 36} strokeWidth={1.6} aria-hidden="true" />
    </div>
  );

  if (!src || failedSrc === src) return placeholder;

  return (
    <img
      className={`mr-poster-image mr-poster-image-${size}`}
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      style={{
        width: dimensions.w, height: dimensions.h,
        borderRadius: size === 'thumb' ? 4 : 8,
        objectFit: 'cover', border: '1px solid var(--mr-border)',
      }}
    />
  );
}