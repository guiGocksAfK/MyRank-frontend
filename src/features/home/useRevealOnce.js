import { useEffect, useRef, useState } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Fica `true` uma única vez, quando o elemento entra na tela (fração `threshold`
 * visível). Com prefers-reduced-motion já nasce `true`: tudo aparece pronto.
 */
/* no celular as seções viram uma coluna só e ficam muito altas: uma fração grande
   delas nunca cabe na tela, então lá basta um pedacinho aparecer. PC não muda. */
const isPhone = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(max-width: 640px)").matches;

export default function useRevealOnce(desktopThreshold = 0.35) {
  const threshold = isPhone() ? 0.08 : desktopThreshold;
  const ref = useRef(null);
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    const el = ref.current;
    if (visible || !el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, threshold]);

  return [ref, visible];
}
