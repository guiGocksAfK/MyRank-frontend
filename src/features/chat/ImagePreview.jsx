import { useEffect, useState } from 'react';
import { useLanguage } from '../../shared/i18n';

/** Pré-visualização de uma imagem por URL: mostra como fica e avisa se não carregar. */
export default function ImagePreview({ url }) {
  const { t } = useLanguage();
  const tc = t.chat;
  const clean = (url || '').trim();
  const [status, setStatus] = useState('loading');

  useEffect(() => setStatus('loading'), [clean]);

  if (!clean) return null;

  return (
    <div className={`chat-photo-preview is-${status}`}>
      <img
        src={clean}
        alt=""
        onLoad={() => setStatus('ok')}
        onError={() => setStatus('error')}
      />
      <span className="chat-photo-preview-cap">
        {status === 'error' ? tc.photoPreviewError : tc.photoPreview}
      </span>
    </div>
  );
}
