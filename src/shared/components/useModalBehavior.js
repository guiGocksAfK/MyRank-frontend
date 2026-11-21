import { useEffect, useLayoutEffect, useRef } from 'react';

// celular: campo com autoFocus abria o teclado assim que o modal aparecia,
// tampando metade do formulário. Lá o foco fica no diálogo e o teclado só
// abre quando a pessoa toca no campo. PC continua com o cursor no campo.
const isPhone = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches;

const isTextField = (el) =>
  el instanceof HTMLElement && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'range'].includes(el.type)));

// Pilha dos modais abertos: só o de cima responde ao Esc. Sem isso, uma
// confirmação aberta por cima de um formulário fechava os dois de uma vez.
const stack = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamento comum de modal: Esc fecha só o de cima, o foco entra no diálogo
 * ao abrir, o Tab não escapa pra página de trás e, ao fechar, o foco volta pro
 * botão que abriu. `dialogRef` aponta pro elemento com role="dialog" (tabIndex -1).
 */
export default function useModalBehavior(dialogRef, onEscape) {
  const escapeRef = useRef(onEscape);
  useEffect(() => { escapeRef.current = onEscape; });

  // roda antes da tela pintar: tira o foco do campo antes do teclado subir
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && isPhone() && dialog.contains(document.activeElement) && isTextField(document.activeElement)) {
      dialog.focus();
    }
  }, [dialogRef]);

  useEffect(() => {
    const token = {};
    stack.push(token);
    const opener = document.activeElement;
    const dialog = dialogRef.current;
    // campo com autoFocus já pegou o foco; senão o próprio diálogo recebe
    if (dialog && !dialog.contains(document.activeElement)) dialog.focus();

    function handleKeyDown(event) {
      if (stack[stack.length - 1] !== token) return;
      if (event.key === 'Escape') {
        escapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      // foco num menu que mora fora do diálogo (SelectMenu, InfoTip): não interfere
      if (!dialog.contains(document.activeElement)) return;
      const items = dialog.querySelectorAll(FOCUSABLE);
      if (items.length === 0) { event.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      stack.splice(stack.indexOf(token), 1);
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, [dialogRef]);
}
