import { useEffect, useMemo, useRef, useState } from 'react';
import { uploadAvatar, deleteAvatar, getMe } from '../../services/userService';
import { processAvatarImage, formatBytes } from '../../shared/utils/imageResize';
import Avatar from '../../shared/components/Avatar';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff';
const SERVER_MAX_BYTES = 1_000_000; // limite real do backend (UserAvatarService)

/**
 * Fluxo de troca de foto de perfil:
 *  1. usuário escolhe/arrasta uma imagem
 *  2. preview + processamento no cliente (recorte quadrado, 512px, JPEG)
 *  3. envia; se der erro, mostra TODOS os detalhes (status, corpo, URL...)
 */
export default function AvatarUploadModal({ currentUser, onClose, onDone, onError }) {
  const inputRef = useRef(null);
  const [rawFile, setRawFile] = useState(null);
  const [processed, setProcessed] = useState(null);
  const [processMode, setProcessMode] = useState(true); // true = processar; false = enviar original
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');       // texto do que está acontecendo
  const [errorDetail, setErrorDetail] = useState(null);
  const [copied, setCopied] = useState(false);

  const toSend = processMode ? processed : rawFile;

  // Esc fecha
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  // gera/limpa o objectURL do preview
  useEffect(() => {
    if (!toSend) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(toSend);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [toSend]);

  async function ingest(file) {
    setErrorDetail(null);
    setRawFile(file);
    setProcessed(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorDetail({ kind: 'client', message: `O arquivo "${file.name}" não é uma imagem (type: ${file.type || 'desconhecido'}).` });
      setRawFile(null);
      return;
    }
    try {
      setStage('Processando imagem…');
      const out = await processAvatarImage(file, { size: 512, mime: 'image/jpeg', quality: 0.9 });
      setProcessed(out);
    } catch (err) {
      reportError(err, 'processAvatarImage');
    } finally {
      setStage('');
    }
  }

  function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) ingest(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) ingest(file);
  }

  function reportError(err, opLabel) {
    const detail = err?.detail || {
      kind: 'client',
      op: opLabel,
      message: err?.message || String(err),
      stack: err?.stack || null,
    };
    // eslint-disable-next-line no-console
    console.error(`[avatar] ${opLabel} falhou:`, err, '\ndetalhe:', detail);
    setErrorDetail(detail);
    onError?.(detail);          // PERSISTE no ProfilePanel, sobrevive ao fechar o modal
  }

  async function handleSend() {
    if (!toSend) return;
    setBusy(true);
    setErrorDetail(null);
    try {
      setStage(`Enviando ${formatBytes(toSend.size)}…`);
      await uploadAvatar(toSend);
      setStage('Confirmando…');
      const fresh = await getMe();
      onDone(fresh);
    } catch (err) {
      reportError(err, 'uploadAvatar');
    } finally {
      setBusy(false);
      setStage('');
    }
  }

  async function handleRemove() {
    setBusy(true);
    setErrorDetail(null);
    try {
      setStage('Removendo…');
      await deleteAvatar();
      const fresh = await getMe();
      onDone(fresh);
    } catch (err) {
      reportError(err, 'deleteAvatar');
    } finally {
      setBusy(false);
      setStage('');
    }
  }

  function copyDetails() {
    const text = JSON.stringify(errorDetail, null, 2);
    navigator.clipboard?.writeText(text).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1500); },
      () => {},
    );
  }

  const oversizeRaw = !processMode && rawFile && rawFile.size > SERVER_MAX_BYTES;

  return (
    <div
      role="presentation"
      onClick={() => !busy && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 320,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-labelledby="mr-avatar-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
          padding: '1.5rem',
          background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
          borderRadius: 12, boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
        }}
      >
        <div className="mr-flex mr-items-center mr-justify-between" style={{ marginBottom: 14 }}>
          <h2 id="mr-avatar-modal-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            Foto de perfil
          </h2>
          <button className="mr-btn mr-btn-ghost mr-btn-sm" onClick={onClose} disabled={busy}>✕</button>
        </div>

        {/* Preview */}
        <div className="mr-flex" style={{ gap: 16, alignItems: 'center', marginBottom: 14 }}>
          <div
            className="mr-avatar-lg"
            style={{ width: 96, height: 96, flexShrink: 0, border: '2px solid var(--mr-border)' }}
          >
            {previewUrl
              ? <img src={previewUrl} alt="Prévia" className="mr-avatar-img" />
              : <Avatar user={currentUser} cacheKey={currentUser?._v} className="mr-avatar-lg" />}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--mr-text-secondary)', lineHeight: 1.6 }}>
            {rawFile ? (
              <>
                <div><strong>Original:</strong> {rawFile.name}</div>
                <div>{rawFile.type || '—'} · {formatBytes(rawFile.size)}</div>
                {processed && (
                  <div style={{ color: 'var(--mr-gold)' }}>
                    <strong>Enviar:</strong> {toSend?.type} · {formatBytes(toSend?.size)}
                  </div>
                )}
              </>
            ) : (
              <span>Nenhuma imagem escolhida ainda.</span>
            )}
          </div>
        </div>

        {/* Dropzone / picker */}
        <div
          onClick={() => !busy && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: `1.5px dashed ${dragOver ? 'var(--mr-gold)' : 'var(--mr-border)'}`,
            background: dragOver ? 'var(--mr-gold-20, rgba(212,175,55,0.08))' : 'var(--mr-bg)',
            borderRadius: 10, padding: '1.1rem', textAlign: 'center', cursor: 'pointer',
            fontSize: '0.85rem', color: 'var(--mr-text-secondary)',
          }}
        >
          <input ref={inputRef} type="file" accept={ACCEPT} onChange={onPick} style={{ display: 'none' }} />
          📁 Clique ou arraste uma imagem aqui
          <div style={{ fontSize: '0.72rem', marginTop: 4 }}>PNG, JPEG, WebP — será recortada quadrada</div>
        </div>

        {/* Opção: processar ou enviar cru */}
        <label
          className="mr-flex mr-items-center mr-gap-2"
          style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--mr-text-secondary)', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={processMode}
            onChange={(e) => setProcessMode(e.target.checked)}
            disabled={busy}
          />
          Processar imagem antes de enviar (recomendado — 512px, JPEG)
        </label>
        {oversizeRaw && (
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#ff8d8b' }}>
            ⚠️ O original tem {formatBytes(rawFile.size)} e o servidor aceita até {formatBytes(SERVER_MAX_BYTES)}.
            Marque "processar" ou escolha uma imagem menor.
          </p>
        )}

        {stage && (
          <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: 'var(--mr-text-secondary)' }}>⏳ {stage}</p>
        )}

        {/* Erro detalhado */}
        {errorDetail && (
          <div
            style={{
              marginTop: 12, padding: '0.75rem 0.85rem', borderRadius: 8,
              background: 'rgba(226,75,74,0.10)', border: '1px solid rgba(226,75,74,0.4)',
            }}
          >
            <div className="mr-flex mr-items-center mr-justify-between" style={{ marginBottom: 6 }}>
              <strong style={{ color: '#ff8d8b', fontSize: '0.85rem' }}>
                {errorDetail.kind === 'http'
                  ? `Erro ${errorDetail.status} ${errorDetail.statusText || ''}`
                  : errorDetail.kind === 'no-response'
                    ? 'Sem resposta do servidor'
                    : 'Erro no cliente'}
              </strong>
              <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={copyDetails} type="button">
                {copied ? 'Copiado ✓' : 'Copiar detalhes'}
              </button>
            </div>
            {(errorDetail.serverMessage || errorDetail.hint || errorDetail.message) && (
              <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: 'var(--mr-text-primary, #eee)' }}>
                {errorDetail.serverMessage || errorDetail.hint || errorDetail.message}
              </p>
            )}
            <pre
              style={{
                margin: 0, maxHeight: 200, overflow: 'auto', fontSize: '0.72rem',
                lineHeight: 1.5, color: 'var(--mr-text-secondary)', whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(errorDetail, null, 2)}
            </pre>
          </div>
        )}

        {/* Ações */}
        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'space-between', marginTop: 18 }}>
          <button
            className="mr-btn mr-btn-outline mr-btn-sm"
            onClick={handleRemove}
            disabled={busy}
            type="button"
            style={{ color: '#ff8d8b', borderColor: 'rgba(226,75,74,0.45)' }}
          >
            Remover foto atual
          </button>
          <div className="mr-flex mr-gap-2">
            <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose} disabled={busy} type="button">
              Cancelar
            </button>
            <button
              className="mr-btn mr-btn-gold mr-btn-sm"
              onClick={handleSend}
              disabled={busy || !toSend || oversizeRaw}
              type="button"
            >
              {busy ? 'Enviando…' : 'Enviar foto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
