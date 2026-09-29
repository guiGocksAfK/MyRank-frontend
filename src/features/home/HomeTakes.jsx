import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./useRevealOnce";
import "./homeTakes.css";

/*
 * A conversa acontece "ao vivo" depois que o gráfico ao lado termina de
 * desenhar a maior divergência: o take da Marina aparece e as respostas
 * chegam uma a uma, cada uma precedida de "digitando…". (ms depois de `active`)
 */
const TIMELINE = [
  [2400, { take: true }],
  [3200, { typing: 0 }],
  [4100, { shown: 1, typing: -1 }],
  [4600, { typing: 1 }],
  [5500, { shown: 2, typing: -1 }],
  [6000, { typing: 2 }],
  [6800, { shown: 3, typing: -1 }],
];

const HIDDEN = { take: false, shown: 0, typing: -1 };
const ALL_SHOWN = { take: true, shown: 99, typing: -1 };

const Head = ({ author, score, children }) => (
  <div className="tk-head">
    <span className="home-avatar">{author[0]}</span>
    <b>{author}</b>
    {children}
    {score != null && <span className="tk-score">{score.toFixed(1)}</span>}
  </div>
);

/** Um take (post de opinião sobre uma obra) com as respostas em fio, como no produto. */
const TakeThread = ({ takes, active }) => {
  const [state, setState] = useState(() => (prefersReducedMotion() ? ALL_SHOWN : HIDDEN));
  const { take, replies } = takes;

  useEffect(() => {
    if (!active || prefersReducedMotion()) return undefined;
    const timers = TIMELINE.map(([at, patch]) =>
      setTimeout(() => setState((s) => ({ ...s, ...patch })), at)
    );
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="tk" aria-hidden="true">
      <article className={`tk-take${state.take ? " is-shown" : ""}`}>
        <Head author={take.author} score={take.score}>
          <span className="tk-about">{takes.about}</span>
          <span className="tk-work">{take.work}</span>
        </Head>
        <p className="tk-text">{take.text}</p>
        <p className="tk-meta">
          {takes.agree} {take.agree} · {takes.disagree} {take.disagree} · {replies.length} {takes.repliesLabel}
        </p>
      </article>

      <ol className="tk-replies">
        {replies.map((reply, i) => (
          <li key={i} className={`tk-reply${i < state.shown || state.typing === i ? " is-shown" : ""}`}>
            {state.typing === i ? (
              <div className="tk-head">
                <span className="home-avatar">{reply.author[0]}</span>
                <span className="tk-typing">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ) : (
              <>
                <Head author={reply.author} score={reply.score} />
                <p className="tk-text tk-text-reply">{reply.text}</p>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default TakeThread;
