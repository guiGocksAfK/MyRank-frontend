# Regras do projeto — MyRank Web App

Leia antes de mexer em qualquer coisa. Vale para qualquer pessoa ou ferramenta
(Claude, Codex, etc.) que trabalhe neste repositório.

A API fica em `../MyRank` e tem o próprio `AGENTS.md`. Lá também estão o que
está pendente (`docs/ROADMAP.md`), o porquê das decisões (`docs/decisoes.md`) e
as regras de cada funcionalidade (`docs/`). Regra de negócio é do back; o front
só mostra.

## Git

- **Nunca rodar `git commit`, `git add` nem `git push`.** Quem commita é o
  Guilherme. Ao terminar, entregue cada commit como **uma linha pronta para
  colar** no terminal (PowerShell, por isso `;` e não `&&`), com caminhos a
  partir da raiz do repo (`:/`):
  `git add ":/docs/a.md" ":/docs/b.md"; git commit -m "docs: ..."`
- **No máximo 5 arquivos por commit.** Se passar disso, divida em vários.
- **Mensagem de uma linha só, curta, em português, no padrão Conventional Commits**
  (`feat:`, `fix:`, `style:`, `docs:`, `refactor:`), por exemplo
  `feat: seletor de templates na criação da tabela`.
- Nada de linha `Co-Authored-By` nas mensagens.
- **Nada de plano de commit dentro dos arquivos do projeto** (docs, comentários).
- Trabalho novo vai numa branch nova, nunca direto na `main` (cada push na
  `main` vai direto para o ar pela Vercel).

## Textos e idiomas

- **Todo texto visível passa pelo `src/shared/i18n.jsx`, em PT, EN e ES.** Nada
  de string solta no componente. Texto novo entra nos três idiomas.
- Os textos das conquistas ficam em `src/shared/badgeI18n.js` (o back manda PT).
- Mudou texto para o usuário? Mostre ao Guilherme antes.

## Visual

- **A base é `src/styles/base.css`** (tokens, botões `.mr-btn`, painéis
  `.mr-panel`, campos). Use o que existe antes de criar CSS novo, e não deixe
  CSS sem uso para trás.
- Preto e dourado. Nada de cor fora dos tokens, nada de emoji colorido em
  destaque, nada de cinza "lápis" nos cards.
- Animações tocam uma vez e **sempre** respeitam `prefers-reduced-motion`.
- Tem que funcionar no celular.
- Dados de exemplo (home) são reais, nunca nota inventada.
- Remaster de tela: debater com prints antes, aplicar, e o Guilherme aprova vendo.

## Código

- Siga o estilo em volta: componentes de função, comentários curtos em
  português explicando o **porquê**.
- Chamadas à API só pelos módulos de `src/services/` (que usam `api.js`, a
  instância do Axios com o token). Um 401 desloga e leva ao login.
- Templates (nomes, emojis, linha de detalhes do card) ficam só em
  `src/shared/tableTemplates.js`.
- Mudou o domínio da API? Atualize também o `connect-src` da CSP no `vercel.json`.
- Antes de entregar: `npm run build` passando e `npm run lint` sem erro novo.

## Conversa

- Sempre em português.
- **Debater e fechar a proposta antes de editar código.**
