export const BAR_COLORS = [
  'var(--mr-gold)',
  'var(--mr-blue-light)',
  'var(--mr-green)',
  'var(--mr-purple)',
  '#e24b4a',
];

export function buildPrompt(rankings) {
  const list = rankings
    .map((r, i) => `${i + 1}. "${r.title}" (${r.category}) — nota ${r.note}/10, tempo: ${r.timeMinutes}min`)
    .join('\n');

  return `Você é um analista de perfil de consumo de mídia. Analise o ranking pessoal deste usuário e responda APENAS com um objeto JSON válido, sem texto extra, sem markdown, sem backticks.

RANKING DO USUÁRIO:
${list}

Responda com este JSON exato (substitua os valores pelos seus):
{
  "summaryTitle": "título curto e personalizado do perfil (ex: 'O Explorador de Mundos Épicos')",
  "summaryText": "parágrafo de 2-3 frases descrevendo o perfil de consumo deste usuário com base nos dados",
  "traits": [
    {
      "icon": "emoji",
      "label": "nome do traço",
      "description": "frase curta explicando este traço de personalidade de consumidor"
    },
    {
      "icon": "emoji",
      "label": "nome do traço",
      "description": "frase curta explicando este traço de personalidade de consumidor"
    },
    {
      "icon": "emoji",
      "label": "nome do traço",
      "description": "frase curta explicando este traço de personalidade de consumidor"
    }
  ],
  "tasteProfile": [
    { "name": "categoria/gênero", "percent": 0 },
    { "name": "categoria/gênero", "percent": 0 },
    { "name": "categoria/gênero", "percent": 0 },
    { "name": "categoria/gênero", "percent": 0 },
    { "name": "categoria/gênero", "percent": 0 }
  ],
  "recommendation": {
    "title": "título da obra recomendada",
    "year": 2000,
    "category": "Filme/Série/Jogo/Livro",
    "compatPercent": 0,
    "reason": "2 frases explicando por que esta obra foi recomendada com base no perfil acima"
  }
}

Regras:
- tasteProfile: 5 gêneros/categorias com percent de 0-100 baseados no perfil real do usuário
- recommendation: uma obra que o usuário provavelmente ainda não viu/jogou, com compatPercent entre 70-99
- Responda SOMENTE o JSON, nada mais.`;
}
