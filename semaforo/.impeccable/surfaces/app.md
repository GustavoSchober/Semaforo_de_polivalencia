---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

Escopo: as cinco telas do Semáforo de Polivalência (`app/`) — lista de ciclos, matriz
editável 64×5, painel de risco, simulador de ausência, evolução. Modo do visitante:
**Operate**. Substituição completa do mundo visual; o scaffold do create-next-app é
anti-referência, não autoridade.

Público e tarefa: o colaborador preenche o próprio quadro poucas vezes por mês (é ele,
não o gestor, quem mais preenche); o gestor revisa, decide e leva os números para uma
conversa de promoção, treinamento ou desligamento. As duas cenas pesam igual. Foco
desktop; celular e projeção são v2 declarada.

Constrangimentos herdados: vocabulário de domínio intocável (ciclo, setor, tarefa,
colaborador, nível, semáforo, cobertura, farol, criticidade); regra do farol <2/=2/≥3;
meta de 3; `lib/dominio/` não importa nada; camada de cálculo fica em views SQL; sem
login (sessão fixa) e sem autoavaliação no back end — o desenho acomoda, a habilitação
espera o ADR-005.

Momento memorável: a cascata. Mudar um nível faz a palheta rolar 0→1→2→3→4; marcar uma
ausência no simulador faz a onda de reflape correr o painel inteiro e linhas passarem de
ON TIME para CANCELLED na frente de quem decide.

Decisões em aberto: a fórmula de `criticidade()` ainda não foi validada com o gestor —
só ordena, nunca é publicada como indicador. A visão consolidada da empresa não tem
segundo departamento para exercitar.

## Direction contract

**THESIS.** Cada tarefa é uma linha viva de painel de partidas de estação: tem horário,
destino, plataforma e situação, e a situação muda na frente de todo mundo. A ferramenta
recusa o arranjo que esta categoria sempre entrega — sidebar, fileira de KPI cards,
tabela paginada, gráfico de rosca — porque esse arranjo transforma risco operacional em
relatório. Um painel de partidas não relata: ele avisa. O encaixe não é metáfora
emprestada: uma obrigação fiscal literalmente tem horário de partida, e `prazo_ancora`
("dia 10", "dia 20", "mensal", "diária") já é a coluna TIME do painel.

**OWN-WORLD.** Fundo de palheta fosca `#0D0D0F` com a sombra de dobradiça `#1B1B1E`
desenhando a grade de células; tinta pintada `#F2F2F2`, nunca branco puro. Moldura de aço
escovado `#B6BBC2`→`#7D838C` em faixas horizontais que separam as regiões e são a única
superfície com gradiente na interface. Archivo em dois eixos de largura: Narrow em caixa
alta espacejada para toda a cromagem, dados e estados; largura normal, caixa de sentença,
para as 64 descrições de tarefa. Cada célula de nível é uma palheta com linha de
dobradiça no meio. Sem cards, sem cantos arredondados além do raio da palheta, sem
sombra que não seja a da dobradiça.

**PALETA POR LEI.** Âmbar `#FFB400` só onde o farol dá amarelo e na ação primária.
Vermelho `#D32F2F` só onde o farol dá vermelho. Verde só como lâmpada pequena de
situação, nunca preenchendo a linha — num painel em que 200 linhas brilham, nada lê.
Aço `#7D838C` é o canal de confiança, separado do canal de risco por matiz e por forma:
célula não avaliada é a palheta que nunca foi virada (`--` em aço), e todo aviso de dado
frágil vem em faixa de aço, jamais em âmbar.

**STORY.** Quem preenche entende em um olhar que sua linha é uma partida com situação, e
que virar palheta é rápido e reversível. Quem decide vê o painel mudar de situação
enquanto mexe no simulador, e sai com a lista de linhas que passaram a CANCELLED — não
com uma porcentagem.

**FIRST VIEWPORT (matriz).** Moldura de aço de borda a borda no topo, 64px, com o
departamento em caixa alta espacejada à esquerda e, à direita, a cobertura desenhada como
contador de palhetas correndo até a meta, não como percentual em caixa. Abaixo, a barra
de cabeçalho do painel em aço escuro: HORÁRIO · TAREFA · SETOR · as cinco colunas de
colaborador com pontos · N1 N2 N3 N4 rotulados. Então o campo: 64 linhas de palheta sobre
preto, separadas por hairline de dobradiça, agrupadas por setor com faixa de aço nomeando
a plataforma. As colunas de farol à direita carregam a lâmpada de situação. Ação primária
— nenhuma: a matriz grava sozinha, e o estado de gravação vive na moldura como a luz de
serviço do painel.

**FORM.** Painel Split-Flap de concourse (`signals-instruments-split-flap-concourse`),
desafiante sorteado e escolhido pelo usuário sobre a direção assinada 7 (Carta de
Sondagem). Seed key `25dd649c`, escopo direction, modo operate.

**TRADUÇÕES NOMEADAS** (colisões resolvidas campo a campo, o constrangimento fixado vence):
- *Semáforo × painel acromático:* o painel marca só o que exige ação, mas o produto se
  chama Semáforo e o verde é obrigatório. Verde vira lâmpada de situação real e discreta;
  âmbar e vermelho ficam com o tratamento cheio de pílula. O verde existe e é nomeável
  sem inundar o campo.
- *Caixa alta do painel × 64 descrições longas em português:* caixa alta espacejada fica
  com a cromagem, os estados, os rótulos e os numerais; a caixa de sentença fica com o
  conteúdo. Uma descrição de 80 caracteres em versalete espacejado seria ilegível.
- *Fundo preto × leitura de uma hora sob luz de escritório:* o mundo foi fixado pelo
  usuário e é cumprido; a mitigação é craft, não diluição — preto de palheta em vez de
  preto puro, tinta `#F2F2F2` em vez de branco puro, e ritmo de linha generoso.

**ELEVAÇÕES** (disciplina doada pelos desafiantes recusados, nunca a roupa deles):
- *de Partitura Labanotation:* lei de notação — cada propriedade visual carrega
  exatamente um dado. Palheta virada = nível. Lâmpada = farol. Aço = confiança. Nada
  decorativo entra.
- *de Fósforo de Fliperama:* paleta por lei, com reserva declarada acima.
- *de Folha Miura:* um artefato em quatro aproximações. As cinco rotas deixam de ser
  cinco páginas e viram modos do mesmo painel, dentro de uma moldura de aço persistente.
- *de Encarte de Cassete:* a meta como recipiente com capacidade visível — a cobertura
  enche até a marca de 3 pessoas em vez de virar percentual abstrato.
- *de Borda de Nuvem:* o campo de dados fica acromático; a cor entra só na borda onde a
  regra dispara.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
