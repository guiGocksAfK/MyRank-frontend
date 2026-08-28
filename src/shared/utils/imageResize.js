/**
 * Processa a imagem escolhida pro avatar ANTES de enviar:
 * - recorta no centro pra ficar quadrada
 * - redimensiona pra no máximo `size` px
 * - re-encoda em JPEG (ou PNG se pedir), garantindo tipo permitido e arquivo pequeno
 *
 * Isso deixa o upload robusto: independentemente do que o usuário escolher
 * (HEIC convertido, PNG gigante, etc.), sai um JPEG <~200 KB.
 */
export async function processAvatarImage(file, { size = 512, mime = 'image/jpeg', quality = 0.9 } = {}) {
  const bitmap = await loadBitmap(file);

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);

  if (bitmap.close) bitmap.close();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem (canvas.toBlob retornou vazio).'))),
      mime,
      quality,
    );
  });

  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const baseName = (file.name || 'avatar').replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.${ext}`, { type: mime, lastModified: Date.now() });
}

function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => loadViaImg(file));
  }
  return loadViaImg(file);
}

function loadViaImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível abrir a imagem escolhida. Formato não suportado pelo navegador?'));
    };
    img.src = url;
  });
}

export function formatBytes(bytes) {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
