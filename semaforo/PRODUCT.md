# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Colaborador do departamento — o usuário mais frequente e o principal responsável
pelo preenchimento.** Declara quais tarefas executa e em que nível de domínio, no
seu próprio quadro. Também consulta a matriz dos colegas: para saber a quem pedir
ajuda e para ver o que precisa aprender para crescer. Não é usuário de sistema de
gestão; abre a ferramenta poucas vezes por mês, em geral no fechamento do ciclo.

**Gestor do departamento.** Revisa, corrige e valida o que a equipe preencheu;
remove duplicidades; decide treinamento, promoção, adequação e desligamento com os
números na mão. Também preenche quando precisa. Além da visão do próprio
departamento, precisa de uma **visão consolidada da empresa** — risco agregado
acima do seu próprio setor.

**Diretoria** (confirmada como destinatária dos dados na documentação funcional,
ainda sem tela). Lê risco consolidado. Se vê nome de pessoa ou só agregado por
setor continua em aberto — está no backlog como pergunta ao gestor.

## Product Purpose

Responder com números, não com achismo, a duas perguntas: quantas pessoas sabem
fazer cada tarefa do departamento, e o que acontece se uma delas sair amanhã.

A ferramenta cruza o catálogo de tarefas do departamento com o nível de domínio de
cada colaborador (0 a 4) e transforma o resultado em risco visível: semáforo por
tarefa, cobertura por setor e por departamento, simulação de ausência e curva de
evolução individual mês a mês.

Sucesso é o gestor enxergar o ponto único de falha **antes** dele virar problema —
e o colaborador saber, sem perguntar a ninguém, o que aprender em seguida e com
quem.

## Positioning

Nasceu como planilha Excel em uso real e está virando aplicação. O que a planilha
não pode oferecer e é o motivo de existir do software:

- **É impossível marcar o nível 4 sem os níveis 1, 2 e 3.** Não existem quatro
  caixas independentes; existe um inteiro de 0 a 4 com `CHECK` no banco.
- **Nada calculável é armazenado.** Os divisores nunca desatualizam em silêncio,
  como os `(120*3)`, `(56*3)` e `280` da planilha faziam.
- **O ciclo fechado é imutável, inclusive para o gestor.** O histórico é a fonte da
  curva de evolução e não pode ser reescrito.
- **"Não avaliado" é diferente de "zero".** A planilha não sabia distinguir os dois
  e produzia colaboradores zerados sem motivo.

## Operating Context

Ciclo mensal. O colaborador preenche o próprio quadro; o gestor revisa e valida; a
ferramenta aplica os cálculos; o gestor decide. Fecha-se o ciclo e abre-se o
seguinte, copiando os valores e zerando o `avaliado` — nada é sobrescrito.

**Foco de uso agora: desktop.** Celular e projeção em reunião são v2 declarada — a
estética e a funcionalidade plena do desktop vêm primeiro.

**Duas cenas de uso pesam igual:**
1. *O preenchimento* — a matriz de 64 tarefas × 5 pessoas. Se doer, o resto não
   acontece.
2. *A conversa de decisão* — o painel e o simulador abertos na frente de outra
   pessoa para justificar um treinamento, uma promoção ou um desligamento.

## Capabilities and Constraints

**Domínio e vocabulário (não renomear):** ciclo, setor, tarefa, colaborador, nível,
semáforo, cobertura, farol, criticidade, polivalência.

- **Escala de nível:** 0 não executa · 1 aprendendo · 2 faz com ajuda · 3 faz
  sozinho · 4 faz e ensina.
- **Regra do farol (regra central, na letra do sponsor):** menos de 2 pessoas →
  vermelho; exatamente 2 → amarelo; 3 ou mais → verde. **Zero e um são ambos
  vermelhos — não é engano, é a regra.**
- **Meta institucional:** 3 pessoas por nível, por tarefa. É o divisor de toda
  cobertura e o mesmo número que define o verde.
- **Falsa sensação de segurança:** nível 1 verde com nível 4 vermelho. A operação
  do dia está de pé; a capacidade de formar substituto, não.
- **Criticidade ponderada:** fórmula proposta pela arquitetura, **ainda não validada
  com o gestor**. Só pode ordenar lista; nunca ser publicada como indicador.
- Catálogo real: 7 setores, 64 tarefas. Departamento de exemplo com 5 pessoas.
- Cobertura trava em 100% (`least(n,3)`), decisão de negócio registrada.
- Stack existente: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4,
  Drizzle, PostgreSQL 17 em contêiner. A camada de cálculo vive em views SQL.
- `lib/dominio/` não importa nada. Nenhuma regra de negócio pode migrar para a
  interface.

**Aberto / bloqueado hoje:**
- **Não há login.** `lib/auth/sessao.ts` devolve um gestor fixo, e a aplicação se
  recusa a subir em produção por causa disso. A tela de identidade da pessoa
  precisa existir no desenho, mesmo servida por um usuário fixo.
- **A autoavaliação do colaborador — que os usuários confirmaram ser o fluxo
  principal de preenchimento — ainda não tem back end.** As permissões escritas
  hoje deixam só o gestor escrever na matriz. O desenho deve acomodar o
  colaborador editando o próprio quadro; a habilitação depende do login.
- **A visão consolidada da empresa não tem tela nem segundo departamento.** A
  coluna `departamento_id` já existe em tudo.
- Abrir e fechar ciclo, e o CRUD de tarefa/setor/pessoa, ainda são feitos por SQL.

## Brand Commitments

Nome: **Semáforo de Polivalência**. A metáfora do semáforo (vermelho, amarelo,
verde) é o vocabulário do sponsor e da planilha em uso — é obrigatória, não
decorativa.

Idioma: **português do Brasil**, em toda a interface, incluindo números e datas.

Voz herdada da documentação e do código: direta, sem eufemismo corporativo,
disposta a dizer em voz alta quando um número não é confiável. ("Esta simulação não
é confiável." / "Ciclo fechado é imutável, inclusive para o gestor.") Preservar.

## Evidence on Hand

- `Semáforo de Polivalência - v2.xlsx` — a planilha em uso, que serve de
  especificação.
- `documentacao-semaforo-de-polivalencia.md` — regras de negócio, catálogo de
  tarefas e as 7 inconsistências mapeadas da planilha.
- `arquitetura-semaforo-de-polivalencia.md` — ADRs e plano de construção.
- `ESTADO-DO-PROJETO.md` · `semaforo/BACKLOG.md` — estado real e fila de ideias.
- `lib/db/catalogo.ts` — os 7 setores e 64 tarefas reais, digitados da documentação.

**Não fabricar:** os dados de `db:seed-dev` são sintéticos. Nenhum número de
cobertura, nome de colaborador ou resultado de simulação visto em tela hoje
representa a realidade do departamento. A matriz real ainda não foi digitada.

## Product Principles

1. **O risco é a mensagem.** Todo número na tela existe para responder "onde estou
   exposto" e "o que faço a respeito". Número sem consequência não merece espaço.
2. **Um dado incerto se declara incerto.** Célula não avaliada, simulação sobre
   matriz incompleta, fórmula não validada — a interface diz isso em voz alta, e
   não deixa o gestor levar um número frágil para uma reunião sem saber.
3. **A inclinação conta mais que a posição.** Na avaliação de pessoas, quem cresceu
   pesa mais que quem lidera. O desenho não pode transformar evolução em ranking.
4. **Preencher é a porta de entrada.** Quem preenche é a equipe, não um operador
   treinado. Se o preenchimento for burocracia, não haverá dado — e sem dado não
   há nenhuma das outras telas.
5. **Ninguém é avaliado por uma régua invisível.** A pontuação é pública, a regra é
   a mesma para todos, e a interface mostra a regra junto do resultado.

## Accessibility & Inclusion

Não há norma estabelecida pela empresa. Duas exigências vêm do próprio domínio:

- **A cor nunca pode ser a única portadora do estado.** O semáforo precisa de um
  segundo canal (número, forma, rótulo) — tanto por daltonismo quanto porque o
  painel será projetado e impresso.
- **A matriz é preenchida em volume.** Navegação e edição completas por teclado não
  são acessibilidade opcional aqui; são a diferença entre a ferramenta ser usada e
  ser abandonada.
