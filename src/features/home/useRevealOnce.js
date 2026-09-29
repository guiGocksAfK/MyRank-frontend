import { useEffect, useRef, useState } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Fica `true` uma única vez, quando o elemento entra na tela (fração `threshold`
 * visível). Com prefers-reduced-motion já nasce `true`: tudo aparece pronto.
 */
export default function useRevealOnce(threshold = 0.35) {
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
