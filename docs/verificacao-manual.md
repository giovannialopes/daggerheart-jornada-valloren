# Roteiro de verificação manual

Executar antes de cada release, num mundo de teste com o sistema Daggerheart.

## Preparação
- [ ] Criar uma Scene com grade hexagonal (qualquer um dos quatro layouts).
- [ ] Ativar o módulo. Confirmar que a aba "Jornada" aparece nos controles de cena.
- [ ] Abrir uma Scene com grade quadrada: confirmar o aviso e que nada quebra.

## Pintar
- [ ] Com a ferramenta "Pintar hex", clicar num hex e preencher habitat e terreno.
- [ ] Reabrir o mesmo hex: os valores salvos aparecem preenchidos.
- [ ] Marcar um hex como santuário: a borda dourada aparece.
- [ ] Marcar um hex como corrompido: o tom arroxeado aparece.

## Viagem
- [ ] Definir o token do grupo com o botão dos controles.
- [ ] Arrastar o token para um hex adjacente: o diálogo de confirmação aparece
      com o habitat, o terreno e os dias corretos.
- [ ] Cancelar o diálogo: o token volta para onde estava e o dia não muda.
- [ ] Confirmar: o dia avança conforme o terreno.
- [ ] Arrastar para um hex nunca pintado: o diálogo de pintar abre primeiro.
- [ ] Arrastar para um hex distante: a oferta de reposicionar sem custo aparece,
      e aceitar não cobra dias.

## Névoa
- [ ] Entrar num hex e confirmar que os seis vizinhos foram revelados.
- [ ] Abrir uma sessão como jogador: os hexes não revelados aparecem opacos.
- [ ] Como Mestre, os mesmos hexes aparecem translúcidos.
- [ ] Como jogador, tentar mover o token do grupo: o movimento é recusado.

## Encontro
- [ ] Viajar por um hex de terreno 4: o card mostra 4d6.
- [ ] Com um 1 na rolagem: o card anuncia o encontro, visível a todos.
- [ ] Sem nenhum 1: o card é sussurrado ao Mestre, com o botão de Medo.
- [ ] Clicar no botão de Medo: a mensagem de encontro forçado é publicada.

## Painel
- [ ] Abrir o painel pelo botão dos controles.
- [ ] Fazer três descansos curtos fora de santuário: o quarto fica desabilitado
      com a explicação no tooltip.
- [ ] Fora de santuário, o descanso longo está desabilitado.
- [ ] Dentro de santuário, o descanso longo funciona e zera o contador de curtos.
- [ ] "Fim de sessão" oferece a primeira caixa não marcada do tier e aceita o texto.
- [ ] Trocar de Scene: a Trilha da Perdição continua marcada.

## Anotações de API
Registrar aqui qualquer método do Foundry que tenha se comportado de forma
diferente do previsto no plano — em especial `canvas.grid.getOffset`,
`getCenterPoint`, `getTopLeftPoint` e `getVertices`.
