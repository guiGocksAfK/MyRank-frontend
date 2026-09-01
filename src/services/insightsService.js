import api from './api';

/**
 * Gera (ou reaproveita do cache do backend) a análise de IA para as obras dadas.
 * @param {number[]} workIds  ids das obras selecionadas no painel
 * @param {boolean}  refresh   força nova geração mesmo com cache
 */
export async function generateInsights(workIds, refresh = false) {
  const { data } = await api.post('/insights/generate', { workIds, refresh });
  return data;
}

/** Última análise já gerada pelo usuário, ou null se nunca gerou (204). */
export async function getLatestInsights() {
  const res = await api.get('/insights/latest');
  return res.status === 204 ? null : res.data;
}

/**
 * Pergunta de follow-up sobre uma análise. Consome 1 do orçamento diário de
 * mensagens de IA (15/dia, reseta às 6h; gerar análise também conta).
 * Devolve o InsightResponseDTO atualizado, com `chat`, `dailyRemaining` e `dailyLimit`.
 */
export async function sendInsightChat(insightId, question) {
  const { data } = await api.post(`/insights/${insightId}/chat`, { question });
  return data;
}
