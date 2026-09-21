# Jornada por Valloren — Documento de Design (v1)

**Data:** 2026-09-21
**Módulo:** `daggerheart-jornada-valloren`
**Sistema alvo:** `daggerheart` · **Foundry:** mínimo v13, verificado v14

---

## 1. Objetivo

Levar para o Foundry VTT o procedimento de viagem por hexágonos usado na
campanha *Journey to Horizon*, do livro *Daggerheart: Hope & Fear*. O sistema
Daggerheart não tem nada equivalente no core: viagem é narrativa livre. Este
módulo entrega o motor dessa viagem — custo em dias por terreno, revelação
progressiva do mapa, dados de encontro, limite de descansos fora de santuário e
a trilha de desastres crescentes da campanha.

O módulo é uma **ferramenta de mesa**, em português do Brasil, feita por fã.
Não é afiliado à Darrington Press nem à Jambô Editora.

### Conteúdo vs. mecânica

O módulo implementa a **mecânica** do capítulo (que não é protegida) e traz
tabelas de geração com **conteúdo autoral próprio**, nas mesmas faixas de dado.
Nenhuma tabela do livro é reproduzida. Quem tem o livro pode substituir as
RollTables pelas suas.

---

## 2. Escopo

### Dentro da v1

- Pintar hexes manualmente: habitat, classificação de terreno (1–4), marca de
  corrompido (*shadowblight*) e marca de santuário.
- Viagem hex a hex: custo em dias conforme o terreno, com confirmação antes de
  aplicar.
- Revelação progressiva: entrar num hex revela seus vizinhos no mapa dos
  jogadores.
- Dados de Encontro: `Nd6` onde N é a classificação de terreno; qualquer `1`
  dispara encontro. Botão para o Mestre gastar 1 Medo e forçar um encontro.
- Painel de jornada: dia atual, descansos curtos usados (máx. 3 fora de
  santuário), descanso longo bloqueado fora de santuário, Trilha da Perdição.

### Fora da v1 (planejado para v1.1)

- RollTables autorais de habitat, encontro, rumores e santuários.
- Gerador de região: rola as tabelas e pinta um bloco de hexes contíguos,
  criando um Journal da região.
- Gerador de santuário e de nome de assentamento.
- Contagem de Resistência (regra opcional do livro).
- Viagem por água: rio a favor da corrente reduz o terreno em 1; oceano rola
  clima.

### Explicitamente fora

- As features de adversário *Shadowblighted* e *Terranamancer*. São conteúdo de
  Actor e pertencem a um módulo de compêndio, não a uma ferramenta de mapa.
- Qualquer arte ou mapa oficial da campanha.

---

## 3. Modelo de dados

Três escopos de persistência, cada um com um dono claro.

### 3.1 Mapa — flag da Scene `daggerheart-jornada-valloren.hexes`

Dicionário esparso, chave `"<linha>.<coluna>"` derivada do offset da grade:

```jsonc
{
  "12.7": {
    "habitat": "floresta",     // string livre; id de habitat
    "terreno": 3,              // 1..4
    "corrompido": false,       // shadowblight
    "revelado": true,          // visível no mapa dos jogadores
    "santuario": false,        // permite descanso longo
    "regiao": "r-04"           // id opcional de agrupamento (usado na v1.1)
  }
}
```

Hex nunca pintado não tem entrada. Um mapa 40×40 metade preenchido fica na casa
das dezenas de KB — dentro do que uma flag de documento comporta.

### 3.2 Jornada — flag da Scene `daggerheart-jornada-valloren.estado`

```jsonc
{
  "dia": 14,
  "tokenGrupoId": "abc123",
  "hexAtual": "12.7",
  "descansosCurtos": 2
}
```

Fica na Scene porque é o estado daquele mapa.

### 3.3 Trilha da Perdição — setting de mundo

```jsonc
{ "caixasMarcadas": ["t1-a", "t1-b", "t2-a"] }
```

Setting de mundo, e não flag de Scene, porque a Trilha pertence à campanha. Se o
grupo mudar de Scene (segundo continente, mapa ampliado), o progresso não pode
zerar.

---

## 4. Arquitetura

Separação deliberada entre **regra pura** e **integração com o Foundry**. As
regras não importam nada do Foundry, o que as torna testáveis de verdade.

```
scripts/
  regras/                 (puro, sem Foundry — coberto por testes)
    custo-viagem.js       terreno -> dias; ajuste de correnteza
    dados-encontro.js     monta Nd6, identifica os 1s, decide disparo
    descansos.js          limite de 3 curtos; longo exige santuário
    perdicao.js           quais caixas o tier atual libera
  dados/
    hexes.js              leitura/escrita da flag, chave i.j, vizinhos
    estado.js             leitura/escrita do estado da jornada
  canvas/
    camada-hex.js         CanvasLayer: símbolos, pontos de terreno, névoa
    ferramenta-pintar.js  clique no hex -> diálogo de habitat/terreno
  fluxo/
    viagem.js             orquestra: moveu -> custo -> revela -> encontro
    encontro.js           card de chat, botão de Medo
  ui/
    painel-jornada.js     ApplicationV2: dia, descansos, Perdição
  main.js                 init, registro de hooks, settings
```

### 4.1 Névoa própria em vez da fog of war nativa

A fog of war do Foundry é derivada de visão e iluminação. Ela não distingue "o
grupo já esteve aqui" de "o grupo enxerga daqui", e desaparece se a cena for
configurada sem iluminação. O livro pede dois mapas distintos — o mapa-chave do
Mestre, completo, e o mapa dos jogadores, preenchido aos poucos.

O módulo desenha polígonos por cima dos hexes não revelados numa camada própria:
opacos para os jogadores, translúcidos para o Mestre. É reversível, não depende
da configuração de luz da cena e reproduz os dois mapas com uma estrutura só.

### 4.2 Sem socket customizado

Só o Mestre escreve nas flags. Os clientes dos jogadores redesenham a camada no
hook `updateScene`. Menos código e um caminho a menos para dessincronizar.

---

## 5. Fluxos

### 5.1 Preparação

1. O Mestre cria uma Scene com grade hexagonal.
2. Ativa a ferramenta de pintar e define habitat, terreno e corrompido por hex.
3. Marca os hexes que são santuário.
4. Define qual Token representa o grupo.

### 5.2 Viagem (o ciclo principal)

1. O Mestre arrasta o Token do grupo para um hex adjacente.
2. O módulo intercepta **antes** de gravar o movimento e abre a confirmação,
   nomeando o hex, o terreno e o custo em dias.
3. Confirmado: avança o dia, marca o novo hex como atual, revela os seis
   vizinhos e rola os Dados de Encontro.
4. O card de chat mostra os dados com os `1` destacados. Havendo `1`, anuncia o
   disparo do encontro. Não havendo, oferece ao Mestre o botão de gastar 1 Medo
   para forçar um.

A interceptação antes da gravação é o ponto do desenho: um arrastar acidental
não pode consumir dias de campanha de forma irreversível.

### 5.3 Descanso e fim de sessão

O painel oferece descanso curto enquanto houver menos de 3 usados. O descanso
longo só fica ativo quando o hex atual é santuário; fora dele o botão aparece
desabilitado com a razão visível, de modo que a regra se explica na interface.
Um descanso longo zera o contador de curtos.

O botão de fim de sessão apresenta as caixas da Trilha da Perdição liberadas
para o tier do grupo, ainda não marcadas e cuja caixa-pai já esteja marcada.

O tier do grupo é derivado do maior nível entre os personagens jogadores da
campanha, seguindo a faixa de tiers do Daggerheart. O Mestre pode sobrescrever
esse valor no painel, para o caso de grupos com níveis desiguais ou de campanhas
que não começam no nível 1.

---

## 6. Tratamento de erro

| Situação | Comportamento |
|---|---|
| Hex de destino sem dados | Abre o diálogo de pintar; a viagem segue depois |
| Destino não adjacente | Bloqueia; o Mestre tem a ação "reposicionar sem custo" |
| Scene sem grade hexagonal | Módulo inerte; um aviso, sem quebrar a cena |
| Token do grupo não definido | Painel mostra o aviso e o botão para definir |
| Jogador move o Token do grupo | Movimento não é aplicado; só o Mestre confirma |
| Terreno fora de 1–4 na flag | Tratado como 2 e registrado no console |

---

## 7. Verificação

### Testes automatizados (Vitest)

Cobrem os quatro módulos de `regras/`, que são funções puras:

- `custo-viagem`: cada classificação de terreno; valor inválido; correnteza
  reduzindo o custo sem descer abaixo de 1 dia.
- `dados-encontro`: quantidade de dados igual ao terreno; disparo com um `1`;
  disparo com vários `1`; ausência de disparo.
- `descansos`: terceiro curto permitido, quarto negado; longo negado fora de
  santuário; longo zerando o contador.
- `perdicao`: caixa acima do tier negada; caixa aninhada negada enquanto a
  caixa-pai estiver desmarcada; caixa já marcada não reofertada.

### Verificação manual

O lado de canvas e de interface não tem teste automatizado honesto. O
repositório mantém um roteiro em `docs/verificacao-manual.md`, executado antes
de cada release: criar a Scene, pintar hexes, definir o grupo, viajar, conferir
o card de encontro, abrir uma sessão como jogador e confirmar que a névoa
esconde o que deve esconder.

---

## 8. Distribuição

Repositório próprio no GitHub, no mesmo padrão dos outros módulos do autor.
Distribuição por GitHub Release: o `module.json` aponta `manifest` e `download`
para `releases/latest/download/`.

O `README.md` traz o aviso de conteúdo não oficial e explicita que as tabelas
incluídas são autorais, não as do livro.
