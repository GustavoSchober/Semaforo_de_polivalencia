# Semáforo de Polivalência

**Quantas pessoas da sua equipe sabem fazer cada tarefa? E o que acontece se uma delas sair amanhã?**

O Semáforo de Polivalência responde essas duas perguntas com números, não com achismo.

---

## O problema

Toda equipe tem tarefas que dependem de uma única pessoa. Todo gestor sabe disso — mas
raramente sabe **quais** tarefas, **quantas** são, e **quanto** isso custaria numa férias,
num afastamento ou num pedido de demissão.

Essa informação normalmente só aparece quando já virou problema.

## A solução

Uma matriz que cruza **todas as tarefas do departamento** com **o nível de domínio de cada
colaborador**, em quatro níveis:

| Nível | Significado |
|---|---|
| 1 | Está aprendendo |
| 2 | Consegue fazer com ajuda |
| 3 | Consegue fazer sozinho |
| 4 | Consegue fazer **e ensinar** |

A partir desse cruzamento, cada tarefa ganha um sinal:

- 🔴 **Vermelho** — ninguém ou só uma pessoa sabe fazer. Ponto único de falha.
- 🟡 **Amarelo** — duas pessoas cobrem. Backup mínimo.
- 🟢 **Verde** — três ou mais. Situação adequada.

O risco deixa de ser uma intuição e passa a ser uma cor na tela.

---

## O que o gestor ganha com isso

**Enxerga o risco antes dele acontecer.** Um painel mostra o percentual de cobertura do
departamento e de cada setor. Dá para ver, em segundos, qual área está mais exposta.

**Simula um desligamento sem correr o risco.** Remova um colaborador da conta e veja
exatamente quais tarefas ficam descobertas — antes de tomar a decisão, não depois.

**Avalia pessoas por evolução, não por impressão.** O histórico mês a mês mostra quem
aprendeu e quem estagnou. Promoção, adequação e desligamento passam a ter base documentada.
Quem lidera o ranking pode estar parado há seis meses; quem está atrás pode ser quem mais
cresceu. A inclinação conta mais que a posição.

**Direciona o treinamento para onde importa.** Uma tarefa com três "aprendizes" e nenhum
especialista parece coberta e não está: ninguém ali é capaz de formar um substituto.

**Consolida a visão da empresa, não só a do gestor.** Cada departamento alimenta a mesma
estrutura, e o risco operacional passa a ser visível no nível da organização.

## O que o colaborador ganha com isso

**Sabe a quem pedir ajuda.** A matriz é visível para a equipe: quem domina cada tarefa está
identificado.

**Sabe o que aprender para crescer.** O próprio quadro mostra as lacunas — e o quadro dos
colegas mostra o caminho. A troca de conhecimento deixa de depender de iniciativa isolada.

**É avaliado por critério transparente.** A pontuação é pública e a régua é a mesma para todos.

---

## Como funciona na prática

1. O colaborador declara, em formulário individual, as tarefas que executa e o nível de domínio.
2. O gestor revisa, remove duplicidades e valida.
3. A ferramenta aplica os cálculos — semáforo, cobertura por setor, pontuação e evolução.
4. O gestor decide, com os números na mão.

O ciclo se repete a cada mês. Nada é sobrescrito: o histórico permanece, e é dele que sai a
curva de evolução de cada pessoa.

---

## Estado do projeto

A ferramenta nasceu como planilha e está em processo de virar aplicação web multiusuário,
rodando na rede interna da empresa.

| Arquivo | Conteúdo |
|---|---|
| `documentacao-semaforo-de-polivalencia.md` | Documentação funcional da planilha atual — regras de negócio, catálogo de tarefas e inconsistências mapeadas |
| `arquitetura-semaforo-de-polivalencia.md` | Decisões de arquitetura e plano de construção do sistema |
| `Semáforo de Polivalência - v2.xlsx` | A planilha em uso, que serve de especificação |
| `schema_inicial_pg.sql` · `semaforo_como_view.sql` | Modelo de dados e camada de cálculo em SQL |
