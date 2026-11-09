import { useState } from 'react';
import { useLanguage } from '../../shared/i18n';

/** Pré-visualização de uma imagem por URL: mostra como fica e avisa se não carregar. */
export default function ImagePreview({ url }) {
  const { t } = useLanguage();
  const tc = t.chat;
  const clean = (url || '').trim();
  // o resultado vale só pro endereço em que saiu: mudou a URL, volta a 'loading' sozinho
  const [result, setResult] = useState({ url: '', status: 'loading' });
  const status = result.url === clean ? result.status : 'loading';

  if (!clean) return null;

  return (
    <div className={`chat-photo-preview is-${status}`}>
      <img
        src={clean}
        alt=""
        onLoad={() => setResult({ url: clean, status: 'ok' })}
        onError={() => setResult({ url: clean, status: 'error' })}
      />
      <span className="chat-photo-preview-cap">
        {status === 'error' ? tc.photoPreviewError : tc.photoPreview}
      </span>
    </div>
  );
}
