import { useEffect, useRef, useState } from 'react';

const EMOJIS = [
  '😀', '😂', '🥹', '😅', '😊', '😍', '😘', '😎', '🤔', '😐',
  '😴', '🙄', '😭', '😡', '🥳', '😱', '🤯', '🤗', '🙏', '👍',
  '👎', '👏', '🙌', '💪', '🔥', '✨', '🎉', '❤️', '💔', '💯',
  '👀', '💀', '🤝', '🫡', '🫠', '🤡',
];

/** Botão de emoji do composer + popover simples. */
export default function EmojiPicker({ onPick, label }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="chat-emoji-wrap" ref={wrapRef}>
      <button
        type="button"
        className="chat-emoji-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
      >
        🙂
      </button>
      {open && (
        <div className="chat-emoji-pop">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="chat-emoji-cell"
              onClick={() => {
                onPick(e);
                setOpen(false);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
