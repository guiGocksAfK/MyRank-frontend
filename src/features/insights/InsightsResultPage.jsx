import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = '/api/insights';

export default function InsightsResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const selectedItems = Array.isArray(state.selectedItems) ? state.selectedItems : [];

  const [status, setStatus] = useState('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const connectionPayload = useMemo(() => ({
    type: 'connect',
    selectedItems,
  }), [selectedItems]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionPayload),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const reply = typeof data.reply === 'string'
          ? data.reply
          : 'Conexão estabelecida com a IA. Escreva sua mensagem no chat abaixo.';
        setMessages([{ role: 'assistant', text: reply }]);
        setStatus('connected');
      })
      .catch((error) => {
        console.error('Conexão com API de IA falhou:', error);
        setErrorMessage('Não foi possível conectar à API de IA. Verifique a conexão ou tente novamente mais tarde.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [connectionPayload]);

  const handleBack = () => navigate('/dashboard');

  const handleSend = async (event) => {
    event.preventDefault();
    if (!inputValue.trim() || sending || status !== 'connected') return;

    const userText = inputValue.trim();
    setInputValue('');
    setMessages((current) => [...current, { role: 'user', text: userText }]);
    setSending(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          question: userText,
          selectedItems,
        }),
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const data = await response.json();
      const reply = typeof data.reply === 'string'
        ? data.reply
        : 'A IA respondeu, mas não houve texto de retorno válido.';

      setMessages((current) => [...current, { role: 'assistant', text: reply }]);
    } catch (error) {
      console.error('Erro ao enviar mensagem para API de IA:', error);
      setErrorMessage('Não foi possível enviar sua mensagem. Tente novamente mais tarde.');
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  if (status === 'error') {
    return (
      <div className="mr-space-y-6">
        <div className="mr-card">
          <div className="mr-card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Erro ao conectar</h1>
            <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.95rem', marginBottom: 18 }}>
              {errorMessage}
            </p>
            <button className="mr-btn mr-btn-gold" onClick={handleBack}>
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mr-space-y-6">
      <div className="mr-card">
        <div className="mr-card-body mr-space-y-3">
          <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', marginBottom: 6 }}>
                Chat de IA
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Converse com a IA</h1>
            </div>
            <button className="mr-btn mr-btn-outline" onClick={handleBack}>
              Voltar ao Dashboard
            </button>
          </div>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.95rem', maxWidth: 620 }}>
            {status === 'connecting'
              ? 'Conectando à API de IA...'
              : 'Envie sua mensagem para conversar com a inteligência artificial.'}
          </p>
        </div>
      </div>

      <div className="mr-card" style={{ minHeight: 360 }}>
        <div className="mr-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ flex: 1, overflow: 'auto', maxHeight: 420, display: 'grid', gap: 10 }}>
            {messages.length === 0 ? (
              <div style={{ color: 'var(--mr-text-secondary)', padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Aguarde enquanto a conexão com a API é estabelecida.
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    alignSelf: message.role === 'assistant' ? 'flex-start' : 'flex-end',
                    maxWidth: '90%',
                    padding: '14px 16px',
                    borderRadius: 18,
                    background: message.role === 'assistant' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(212, 175, 55, 0.18)',
                    color: message.role === 'assistant' ? 'white' : 'inherit',
                    border: message.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(212,175,55,0.2)',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                    {message.role === 'assistant' ? 'IA' : 'Você'}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {message.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={status === 'connected' ? 'Digite sua mensagem...' : 'Aguardando conexão...'}
              disabled={status !== 'connected' || sending}
              style={{
                flex: 1,
                minWidth: 0,
                borderRadius: 14,
                border: '1px solid var(--mr-border)',
                background: 'var(--mr-surface)',
                color: 'var(--mr-text)',
                padding: '12px 14px',
                fontSize: '0.95rem',
              }}
            />
            <button
              type="submit"
              className="mr-btn mr-btn-gold"
              disabled={status !== 'connected' || sending || !inputValue.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
