# MyRank Frontend

## Remaster Mobile — REGRA ABSOLUTA

O objetivo do remaster é **apenas adaptar o layout para o celular**.

- **NÃO mudar NADA da versão de PC.** Nenhum botão, texto, cor, posição, espaçamento, componente ou comportamento do desktop.
- Só **redimensionar/reorganizar as coisas para telas pequenas**, usando estilos que só valem no celular (ex.: `@media (max-width: ...)`).
- Não remover nem adicionar funcionalidades: o celular mostra as mesmas coisas que o PC, só que cabendo na tela.
- Nunca alterar um estilo "base" (que vale para todas as telas) se isso mudar o desktop. Na dúvida, colocar a mudança dentro da media query de celular.
- **NO FINAL, A TELA DE PC TEM QUE ESTAR 100% IGUAL AO QUE ERA ANTES.**
