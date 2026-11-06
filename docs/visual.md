# Visual do MyRank

A referência do remaster. Home, login e cadastro já seguem isto; as telas
internas (dashboard, rankings, social, chat, perfil, IA) vão sendo trazidas pra
cá uma por vez. As peças ficam em `src/styles/base.css`: use o que existe antes
de criar CSS novo.

## Identidade

- **Preto de verdade com dourado.** Fundo `#000` (`--mr-bg`). O dourado
  (`--mr-gold`, `#d4af37`) é o **único destaque** e aparece pouco: botão
  principal, número que importa, foco, item ativo.
- **Texto em três níveis:** `--mr-text` (principal), `--mr-text-secondary`
  (apoio) e `--mr-text-muted` (o que quase some: dicas, placeholders).
- **Nada de cinza "lápis".** Cinza sobre preto parece desenho a lápis. Cartão é
  quase preto, e quem dá corpo é a borda-reflexo e o fio de luz no topo
  (`.mr-panel`).
- **Sem cores extras.** Nada de azul, roxo ou verde de destaque, nem emoji
  colorido brigando com o dourado em título ou chip. Os tokens `--mr-blue`,
  `--mr-purple` e `--mr-green` ainda existem por causa das telas antigas e devem
  sumir delas no remaster. Vermelho (`--mr-red`) só pra erro.
- **Fonte Geist**, servida pelo próprio site. Títulos grandes, pesados e com
  letras mais juntas (`--mr-tracking-tight`).
- **Rótulo acima do título:** texto pequeno (`--mr-text-xs`), maiúsculo, com
  letras bem espaçadas (0,2em a 0,3em) e cor apagada, como "ETAPA 1 DE 3" ou
  "PERGUNTAS FREQUENTES".

## Peças da base

| Peça | Classe | Uso |
|---|---|---|
| Botão principal | `.mr-btn .mr-btn-gold` | Uma ação principal por tela ou bloco |
| Botão secundário | `.mr-btn .mr-btn-outline` | Ações ao lado da principal |
| Botão terciário | `.mr-btn .mr-btn-ghost` | Ações discretas (cancelar, ver mais) |
| Tamanhos | `.mr-btn-sm`, `.mr-btn-lg` | Todo botão é pílula; nada de botão retangular |
| Painel | `.mr-panel` | O cartão padrão |
| Menu suspenso | `.mr-menu`, `.mr-menu-item` | Fundo fosco desfocado, como o seletor de idioma |

- **Campos de texto:** fundo `#0b0b0b`, borda branca a 12%, cantos
  `--mr-radius-sm`; no foco, borda dourada e um halo dourado bem fraco. Hoje o
  estilo mora no `auth.css` (`.auth-field`); vale levar pra base (`.mr-input`)
  quando o remaster precisar de campo em outra tela.
- **Navbar fosca** em todo o site (fundo translúcido desfocado), não só ao rolar.
- **Tokens pra tudo:** espaço (`--mr-space-1` a `-8`, de 4 a 64px), texto
  (`--mr-text-xs` a `-2xl`), cantos (`--mr-radius`, `-sm`, `-xs`) e movimento
  (`--mr-duration-fast`, `--mr-duration`, `--mr-ease`, `--mr-ease-out`). Valor
  solto no CSS só quando não existe token pra ele.

## Comportamento

- **Mostrar, não explicar.** Mini-maquete do produto em vez de lista de recursos.
- **Pouca coisa por tela, sem repetir informação.** O login tinha "MyRank" três
  vezes; ficou uma.
- **Animação toca uma vez**, calma (`--mr-ease-out`) e nunca rápida demais pra
  ler. Sempre com `prefers-reduced-motion`, caindo no estado final.
- **Fundos discretos.** Imagem de fundo é ambiente, quase preta e desfocada
  ("mais preto do que capa"). Se competir com o conteúdo, está errado.
- **Dados reais nos exemplos** (médias públicas de MAL, IMDb, Metacritic). Nota
  inventada passa impressão ruim pra quem conhece a obra.
- **Funciona no celular** em toda tela.
- **Textos sempre nos três idiomas** (`src/shared/i18n.jsx`).

## Como fazer o remaster de uma tela

1. Print da tela atual (desktop e celular).
2. Lista do que está fora deste guia, o que polui e o que falta.
3. Debate e decisão; só depois o código.
4. Aplicar usando as peças da base e apagar o CSS que ficar sem uso.
5. O Guilherme aprova vendo.
