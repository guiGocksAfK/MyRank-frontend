import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../shared/i18n';
import { isAuthenticated, setPendingInvite } from '../../services/authService';
import { acceptInvite } from '../../services/chatService';
import './chat.css';

/** Rota /chat/invite/:token — aceita o convite e joga o usuário na conversa. */
export default function ChatInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const ti = t.chat.invite;
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!isAuthenticated()) {
      setPendingInvite(token);
      navigate('/entrar');
      return;
    }

    acceptInvite(token)
      .then((conv) => {
        navigate('/dashboard', { replace: true, state: { tab: 'social', openConvId: conv.id } });
      })
      .catch((err) => {
        setError(err?.response?.data?.message || ti.error);
      });
  }, [token, navigate, ti.error]);

  return (
    <main className="auth-page auth-page--noscroll">
      <section className="auth-card" style={{ margin: 'auto', textAlign: 'center' }}>
        {error ? (
          <>
            <p className="auth-error">{error}</p>
            <button className="auth-submit" type="button" onClick={() => navigate('/dashboard')}>
              {ti.goToChat}
            </button>
          </>
        ) : (
          <p>{ti.joining}</p>
        )}
      </section>
    </main>
  );
}
