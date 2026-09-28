# Semáforo de Polivalência — Estado do Projeto

**Última atualização:** 28 de setembro de 2026
**Documento companheiro de:** `documentacao-semaforo-de-polivalencia.md` (o que a ferramenta faz)
e `arquitetura-semaforo-de-polivalencia.md` (como ela vira software)

---

## 0. Para que serve este arquivo

Os outros dois documentos descrevem **o que construir** e **por quê**. Este descreve
**o que já está construído, o que não está, e onde exatamente retomar** — para que
qualquer pessoa (inclusive você daqui a três meses) consiga voltar ao trabalho sem
reabrir o código para descobrir o que existe.

A regra deste arquivo: **nada aqui é aspiracional.** Se está marcado como feito, foi
verificado; se foi decidido, está escrito por quê; se está pendente, está escrito o que
falta e o que isso desbloqueia.

| Pergunta | Onde procurar |
|---|---|
| O que significa nível 3? Por que 3 pessoas é a meta? | Documentação funcional, seções 3 e 6 |
| Por que Postgres? Por que Next? | Arquitetura, seção 3 (ADRs) |
| **O que já está pronto? Por onde eu continuo?** | **Aqui** |
| Que ideias ficaram para depois? | `semaforo/BACKLOG.md` |
| Como rodo isso na minha máquina? | `semaforo/README.md`, e a seção 2 aqui |

---

## 1. Resumo em uma tela

A aplicação **existe, roda e grava**. Cinco telas funcionando contra Postgres real, com
a camada de cálculo em views verificada por teste. O que falta para virar ferramenta de
verdade são três coisas, nesta ordem: **login**, **abrir/fechar ciclo pela interface** e
**deploy no servidor**.

| Etapa (arquitetura, seção 12) | Estado |
|---|---|
| **1 — Fundação** | ✅ Concluída, exceto o deploy |
| **2 — A matriz** | ✅ Concluída |
| **3 — O que faz alguém querer usar** | 🟡 Painel, simulador e evolução prontos; falta o CRUD de administração |
| **4 — Virar o mês de verdade** | 🔴 Não iniciada (é aqui que entra o login e o abrir/fechar ciclo) |
| **5 — Autoavaliação** | 🔴 Não iniciada |

**Marcos de validação (arquitetura, seção 12) — nenhum atingido ainda:**

- 🔴 **Marco 1 — a comparação.** Exige a matriz REAL digitada pelo gestor. Os dados
  atuais são sintéticos. Ver seção 9.1 aqui.
- 🔴 **Marco 2 — a demonstração.** Tecnicamente já é possível: o simulador está pronto e
  é por onde a arquitetura manda começar a demo. Falta só ter dados reais.
- 🔴 **Marco 3 — a virada acompanhada.** Depende da etapa 4.

**Nada foi commitado.** `git status` mostra `semaforo/` como untracked. O último commit
do repositório continua sendo `ee10c7d feat: adiciona README comercial`.

---

## 2. Retomada rápida

Do zero ao sistema rodando, na máquina atual:

```bash
cd ~/Documentos/repo_pessoal/Semaforo_de_polivalencia/semaforo

npm run db:up        # sobe o Postgres em contêiner (Podman, rootless)
npm run dev          # http://localhost:3000
```

Se o banco estiver vazio (máquina nova, volume apagado):

```bash
npm install
cp .env.example .env.local
npm run db:up
npm run db:migrate   # aplica as 2 migrations
npm run db:seed      # 7 setores + 64 tarefas — o catálogo REAL
npm run db:seed-dev  # níveis sintéticos, 3 ciclos — só para desenvolver
```

Para abrir um `psql` (não há cliente instalado no host, de propósito):

```bash
podman exec -it semaforo-db psql -U semaforo -d semaforo
```

**Por onde começar a olhar:** `http://localhost:3000/simulador/3`. A arquitetura (seção
15) diz que é ali que a decisão de adotar acontece, não na matriz.

---

## 3. Ambiente desta máquina

Fedora Linux 43 (Workstation).

| Ferramenta | Versão | Observação |
|---|---|---|
| Node.js | 22.22.2 | já estava instalado |
| npm | 10.9.7 | |
| git | 2.55.0 | |
| Podman | 5.8.4 | já estava instalado |
| podman-docker | 5.8.4 | instalado nesta sessão — faz `docker` apontar para o Podman |
| podman-compose | 1.5.0 | instalado nesta sessão |
| docker-compose | 5.5.1 | instalado nesta sessão — é o provedor de compose que o `docker compose` chama |
| PostgreSQL | 17.11 | roda em contêiner, não no host |
| `psql` no host | **não instalado** | decisão consciente — usar `podman exec` |

### 3.1 Decisão: Podman em vez de Docker

A arquitetura (ADR-011, seção 14) assume Docker Compose. A máquina já tinha Podman, que
é o caminho nativo do Fedora e roda rootless.

**Escolha: Podman com camada de compatibilidade Docker.** Com `podman-docker` instalado,
o comando `docker` funciona apontando para o Podman, e `docker compose` resolve para o
`docker-compose` 5.5.1. **O `docker/compose.yml` roda sem nenhuma alteração** — foi
validado com `docker compose -f docker/compose.yml config`, que passa.

Consequência: nenhum daemon root em paralelo, e o arquivo de compose continua portátil
para uma máquina com Docker de verdade.

### 3.2 Sobre o cliente Postgres e o Supabase

O `psql` não foi instalado no host a pedido explícito. A intenção declarada é
possivelmente usar **Supabase** mais adiante, com o project criado no site e acesso via
MCP.

**Isso conflita com os ADRs 003, 005, 006 e 011, que decidem "sem nuvem".** Não é um
problema hoje, e vale registrar o que muda quando a hora chegar:

- **O schema não trava a decisão.** É Postgres padrão, sem extensão exótica, exatamente
  como o ADR-011 exige. Migrar é `pg_dump` / `pg_restore`.
- **O ADR-006 muda.** Hoje o banco não é exposto ao navegador e as permissões vivem em
  Server Actions. Com Supabase, a tentação é usar RLS — mas as regras deste domínio
  (ver `lib/auth/permissoes.ts`) são de fluxo com papéis, não de "cada um vê suas
  linhas". A recomendação da arquitetura continua de pé: manter em TypeScript.
- **O ADR-005 fica mais fácil.** O Supabase Auth resolveria o login sem escrever tela de
  senha. O campo `colaborador.auth_user_id` (uuid) já existe exatamente para isso.
- **O ADR-014 (operação) desaparece em boa parte:** backup, disco e certificado deixam
  de ser seus.

---

## 4. Inventário do que existe

Tudo em `semaforo/`. Árvore completa, sem `node_modules` e `.next`:

### 4.1 Domínio — `lib/dominio/` ✅ completo e 100% testado

**Não importa nada.** Nem banco, nem React, nem Next. São funções puras que recebem
números e devolvem números. É a pasta que a arquitetura (seção 10) manda tratar com
disciplina, porque são exatamente as regras que a planilha erra.

| Arquivo | Conteúdo |
|---|---|
| `constantes.ts` | `META_POR_TAREFA = 3`, `NIVEL_MAX = 4`, `ROTULO_NIVEL`, `ehNivelValido()` |
| `farol.ts` | `farol()` — a regra do sponsor (0 e 1 são ambos vermelhos); `falsaSeguranca()` |
| `cobertura.ts` | `pontosDaTarefa()`, `pontosMeta()`, `cobertura()` — com o `least(n,3)` da opção A |
| `criticidade.ts` | `criticidade()` — **proposta, ainda não validada com o gestor** |

### 4.2 Banco — `lib/db/` e `drizzle/` ✅ completo

| Arquivo | Conteúdo |
|---|---|
| `schema.ts` | As 7 tabelas com todos os `CHECK` da seção 4 da arquitetura |
| `catalogo.ts` | O catálogo inicial: 7 setores e 64 tarefas, digitados da seção 5 da documentação funcional, com textos já padronizados |
| `index.ts` | Conexão, com cache global contra o HMR do Next |
| `consultas/ciclos.ts` | `ciclosDoDepartamento()`, `cicloPorId()`, `cicloAnterior()` |
| `consultas/semaforo.ts` | `semaforoDoCiclo()` |
| `consultas/cobertura.ts` | `coberturaPorSetor()`, `coberturaDoDepartamento()`, `celulasPendentes()` |
| `consultas/matriz.ts` | `matrizDoCiclo()` — 64×5 montado na forma da tela |
| `consultas/simulacao.ts` | `simular()`, `pessoasDoCiclo()` |
| `consultas/evolucao.ts` | `evolucaoDosColaboradores()`, `evolucaoDaCobertura()` |

**Migrations aplicadas: 2.** Ambas registradas em `drizzle/meta/_journal.json` e no
banco (`drizzle.__drizzle_migrations`).

| Migration | Conteúdo |
|---|---|
| `0000_schema_inicial.sql` | 5 enums, 7 tabelas, 3 índices, todos os CHECK e FK |
| `0001_camada_de_calculo.sql` | 6 views + 1 função (escrita à mão, registrada como `--custom`) |

**As 6 views e a função:**

| Objeto | Substitui, na planilha |
|---|---|
| `v_semaforo` | Colunas AG:AJ |
| `v_cobertura_setor` | AL:AM e AO:AP (as 7 fórmulas com intervalos errados) |
| `v_cobertura_departamento` | Célula AG5 |
| `v_pontuacao` | Linhas 3 e 4 |
| `v_evolucao` | A aba `Gráfico` |
| `v_evolucao_cobertura` | Não existe na planilha — sugestão 6 da seção 9.2 |
| `f_semaforo_simulado(ciclo, ausentes[])` | Zerar a coluna de alguém à mão |

### 4.3 Permissões e sessão — `lib/auth/`

| Arquivo | Estado |
|---|---|
| `permissoes.ts` | ✅ **Completo e testado** — 13 testes. `podeEditarMatriz`, `podeVerDepartamento`, `podeEnviarAutoavaliacao`, `podeAprovarAutoavaliacao`, `podeAdministrar` |
| `sessao.ts` | 🔴 **Marcador.** Devolve um usuário fixo (o primeiro gestor do departamento) |

### 4.4 Telas — `app/`

| Rota | Arquivo | Estado |
|---|---|---|
| `/` | `app/page.tsx` | ✅ Lista de ciclos com cobertura de cada um |
| `/matriz/[ciclo]` | `app/matriz/[ciclo]/` | ✅ A grade editável — 4 arquivos |
| `/painel/[ciclo]` | `app/painel/[ciclo]/page.tsx` | ✅ Painel de risco |
| `/simulador/[ciclo]` | `app/simulador/[ciclo]/page.tsx` | ✅ Simulação de ausência |
| `/evolucao` | `app/evolucao/page.tsx` | ✅ Pontos e cobertura entre ciclos |
| `/admin/*` | — | 🔴 Não existe |
| `/minha-avaliacao` | — | 🔴 Não existe |
| `/login` | — | 🔴 Não existe |

**A matriz, em detalhe** (é a tela que a arquitetura diz decidir o projeto):

| Arquivo | Papel |
|---|---|
| `page.tsx` | Server component: busca, monta, decide se é editável |
| `grade.tsx` | Client component: estado local, navegação, semáforo ao vivo |
| `celula-nivel.tsx` | O controle de 4 segmentos |
| `actions.ts` | `gravarNivel()` — a única Server Action de escrita que existe hoje |

Requisitos não negociáveis da seção 9.1, todos atendidos:

- ✅ Navegação por teclado — setas movem, `0`–`4` definem, `+`/`−` ajustam
- ✅ Salvamento otimista com indicador ("salvo às 14:32"), e desfaz visual em caso de erro
- ✅ Semáforo ao vivo na lateral, recalculado do estado local
- ✅ Cabeçalho e coluna de tarefa fixos (`sticky`)
- ✅ Células não avaliadas visualmente distintas (tracejadas) das avaliadas com zero
- ✅ Modo leitura para quem não é gestor, com a mesma aparência
- ✅ Agrupamento por setor vindo de `setor_id`, substituindo as linhas em branco

### 4.5 Testes — 39, todos passando

| Arquivo | Testes | Precisa de banco? |
|---|---|---|
| `testes/dominio.test.ts` | 16 | Não |
| `testes/permissoes.test.ts` | 13 | Não |
| `testes/db/calculos.test.ts` | 10 | **Sim** |

```bash
npm test        # 29 testes puros, sem banco
npm run test:db # 10 testes das views
npm run test:all
```

Os testes de banco montam um departamento isolado com 3 tarefas e 4 pessoas, cujos
resultados estão calculados à mão em comentário no topo do arquivo, e limpam tudo no
`afterAll`. Foi conferido que não deixam resíduo.

**O que a seção 13 pede e ainda não existe:** o item 3 (teste de regressão sobre o
cenário real da planilha, com os valores corrigidos) e o item 4 (teste do restore do
backup).

### 4.6 Deploy — `docker/` e `Dockerfile` ✅ escrito, 🔴 nunca executado

| Arquivo | Conteúdo |
|---|---|
| `Dockerfile` | Build multi-stage com `output: 'standalone'`, roda como usuário não-root |
| `docker/compose.yml` | 3 serviços; **só o Caddy publica porta**; segredos via arquivo; rotação de log |
| `docker/Caddyfile` | Proxy reverso, cabeçalhos de segurança |
| `docker/backup.sh` | `pg_dump -Fc`, escrita atômica (`.parcial` → renomeia), retenção de 90 dias |
| `docker/deploy.sh` | 4 passos: backup → build → migrations → subir |
| `docker/secrets/README.md` | Como gerar os três segredos |

**Validado:** `docker compose config` passa. **Nunca executado:** nenhuma imagem foi
construída, nenhum contêiner de aplicação subiu.

---

## 5. Rastreabilidade — os objetivos da documentação funcional

| # | Objetivo | Estado | Onde |
|---|---|---|---|
| 1 | Mapear tarefas + cadastrar novas por categoria | 🟡 O catálogo existe e é modelado; **falta o CRUD** | `lib/db/catalogo.ts`, `tarefa` |
| 2 | Cronograma / periodicidade | 🟡 Modelado com as 4 opções + `prazo_ancora`; falta a tela de edição | `tarefa.periodicidade` |
| 3 | Posicionamento individual | ✅ | `v_pontuacao`, cabeçalho da matriz, `/evolucao` |
| 4 | Grau de conhecimento por tarefa | ✅ | O inteiro 0–4 e a leitura horizontal do semáforo |
| 5 | Troca de conhecimento | 🟡 A matriz é visível a todos; **falta a tela "quem pode me ensinar"** | — |
| 6 | Desempenho ao longo do período | ✅ | `v_evolucao`, `/evolucao` |
| 7 | Risco de desligamento ou ausência | ✅ | `f_semaforo_simulado`, `/simulador` |
| 8 | Base para promoção | ✅ | `/evolucao`, com a variação em destaque |
| 9 | Risco sob a visão da empresa | 🟡 `departamento_id` existe em tudo; falta tela e 2º departamento | ADR-010 |

### 5.1 As 13 regras de negócio da seção 6

| Regra | Estado |
|---|---|
| 1. A única marcação válida é `1` | ✅ Substituída pelo inteiro 0–4, com `CHECK` no banco |
| 2. Preenchimento cumulativo da esquerda para a direita | ✅ Garantido por construção |
| 3. Só o gestor altera a matriz | ✅ `podeEditarMatriz`, verificada em `gravarNivel` |
| 4. Linhas 3/4/5 e colunas AG:AP são fórmulas | ✅ São views — não editáveis porque não são tabelas |
| 5. Semáforo 0 ou 1 = vermelho | ✅ `farol()`, com teste explícito |
| 6. Meta institucional de 3 pessoas | ✅ `META_POR_TAREFA`, usada nas views e no domínio |
| 7. Total é pontuação; variação pesa mais que posição | ✅ `v_evolucao`; a coluna "Variação total" tem peso visual maior |
| 8. Cobertura no nível 1 não é cobertura | ✅ Bloco "Falsa sensação de segurança" no painel |
| 9. Colaborador com zero permanece e puxa a média | ✅ Preservada; `avaliado` só separa zero real de não preenchido |
| 10. Matriz aberta à equipe | ✅ `podeVerDepartamento` libera leitura a todos do departamento |
| 11. Um ciclo por período, o anterior congelado | 🟡 O modelo existe e a escrita é bloqueada; **falta a interface** |
| 12. Gráfico recebe nova coluna a cada período | ✅ Deixou de ser tarefa manual |
| 13. Consolidação entre departamentos | 🟡 Coluna existe; falta a tela |

### 5.2 As 10 inconsistências da seção 8 da documentação

| # | Inconsistência | O que aconteceu |
|---|---|---|
| 1 | `AM4` soma o intervalo de outro setor | ✅ Deixou de existir — `GROUP BY setor_id` |
| 2 | `AM3` exclui a linha 52 | ✅ Deixou de existir |
| 3 | Divisor `280` conta linhas em branco | ✅ Deixou de existir — `count(*)` |
| 4 | Linha 37 com fórmula e sem tarefa | ✅ Deixou de existir — não há "linha" |
| 5 | Aba `Gráfico` defasada | ✅ Deixou de existir — `v_evolucao` |
| 6 | Gráfico plota 3 das 6 séries | ✅ Deixou de existir |
| 7 | Luis e Maykon zerados sem motivo | ✅ Virou visível — campo `avaliado`, avisos na tela |
| 8 | Sem validação de dados | ✅ Deixou de existir — `CHECK (valor between 0 and 4)` |
| 9 | Cobertura pode passar de 100% | ✅ Virou decisão consciente — opção A, com teste |
| 10 | Erros de digitação | ✅ Corrigidos no catálogo |

**As 10 estão resolvidas.** Sete por consequência da modelagem, sem uma linha de código
defensivo — que era exatamente a aposta do documento de arquitetura.

---

## 6. Decisões tomadas durante a implementação

Estas **não estão na documentação nem na arquitetura**. Foram tomadas ao escrever o
código, e cada uma pode ser revista — mas revise sabendo o que está desfazendo.

### 6.1 `v_semaforo` conta apenas células avaliadas — ⚠️ a mais importante

A view da seção 5.1 da arquitetura conta todas as linhas de `nivel`. A implementada
filtra por `avaliado = true`.

**Por quê.** A decisão 7.4 manda, ao abrir um ciclo novo, copiar os valores do anterior
e zerar `avaliado`. Sem o filtro, o ciclo novo nasceria com o semáforo cheio de números
que ninguém confirmou — e o gestor leria como cobertura real algo que é só a foto do mês
passado. Com o filtro, o ciclo novo começa honestamente vazio e vai se preenchendo.

**É a opção conservadora da seção 7.3:** não avaliado conta como zero na cobertura, e a
tela diz isso em voz alta. O painel mostra "64 de 320 células ainda sem avaliação" e o
simulador marca quem tem pendências como não confiável.

**O que muda se você reverter:** a cobertura sobe artificialmente em todo ciclo recém-
aberto, e a simulação de ausência volta a mentir — que é o defeito da inconsistência 7.

### 6.2 `gravarNivel` marca `avaliado = true` sempre

Gravar é avaliar. A partir do momento em que o gestor toca numa célula, o zero dela é um
zero de verdade e não "ninguém preencheu". Não há como marcar uma célula como "revisada
e continua zero" sem gravá-la — mas gravar zero faz exatamente isso.

### 6.3 Os pesos de criticidade foram arbitrados por mim

`tarefa.peso_criticidade` nasce em `1.0`. No catálogo (`lib/db/catalogo.ts`) atribuí:

- **3.0** — EFD Contribuições, EFD IPI e ICMS, DCTFWeb/MIT, ECD, ECF
- **2.0** — Guia de ISS, DARF via SicalcWeb, Pesquisa IBGE, Gerar guias de impostos mensais
- **1.0** — todas as outras 55

**Isso não veio do gestor.** A justificativa é a sugestão 5 da seção 9.2 ("obrigação com
prazo legal em vermelho é mais grave que tarefa diária em vermelho"), mas os números
são meus. Hoje só afetam a **ordenação** do plano de ação. Está no BACKLOG para validar.

### 6.4 ECD, ECF e Pesquisa IBGE viraram `anual`

A planilha põe `Junho` e `Julho` na coluna de periodicidade. Como a decisão 7.2 separa
periodicidade de prazo, elas viraram `periodicidade = 'anual'` + `prazo_ancora = 'junho'`
ou `'julho'`. As outras três obrigações acessórias ficaram `mensal` + `dia 10` / `dia 20`.

Resultado no banco: 42 diárias, 19 mensais, 3 anuais. Confere com a seção 3.1 da
documentação (43 `Diario` menos a linha 37 em branco = 42; 16 `Mensal` + 3 com prazo
fixo mensal = 19).

### 6.5 Sem TanStack Table

A seção 9.1 sugere TanStack Table headless para estrutura e virtualização. **Não foi
usado.** São 64 linhas × 5 colunas — virtualização não paga o próprio custo, e a
estrutura é uma `<table>` com `sticky`. Reavalie se o catálogo passar de umas 300 tarefas
ou se aparecer ordenação/filtro na grade.

### 6.6 Gráfico em SVG escrito à mão, sem biblioteca

`app/evolucao/page.tsx` desenha as linhas em SVG puro. São 5 séries de 3 pontos. Uma
dependência de charting custaria mais em peso e configuração do que o desenho inteiro.
Reavalie se aparecer tooltip, zoom ou legenda interativa.

### 6.7 O simulador usa `searchParams` e um `<form method="get">`

Sem JavaScript de cliente. O estado da simulação vive na URL (`?ausentes=2&ausentes=3`),
o que a torna compartilhável e faz o botão "voltar" funcionar. A tabela "e se cada um
sair sozinho" é calculada no servidor a cada requisição — são 5 chamadas à função SQL,
irrelevante nesta escala.

### 6.8 Convenção `_FILE` para segredos

`lib/segredos.ts` lê `DATABASE_URL` **ou** `DATABASE_URL_FILE`. O compose monta os
segredos em `/run/secrets/` e passa o caminho, de modo que o valor nunca aparece em
`docker inspect` nem no histórico de shell. O `trimEnd()` está lá porque uma quebra de
linha no fim do arquivo vira parte da senha e o erro resultante não ajuda a achar a causa.

### 6.9 Barreira contra subir sem autenticação

`lib/auth/sessao.ts` tem a constante `AUTENTICACAO_IMPLEMENTADA = false`. Com ela em
`false` e `NODE_ENV=production`, a aplicação **lança erro e se recusa a servir**. É uma
trava deliberada para que o marcador de sessão não chegue a produção por esquecimento.

**Ao implementar o ADR-005, vire essa constante para `true`.** Sem isso o deploy não sobe.

### 6.10 Separação `npm test` / `npm run test:db`

`npm test` roda só o que não precisa de banco (29 testes, ~0,5 s). Os testes das views
ficam em `testes/db/` e rodam com `npm run test:db`. Motivo: exigir Postgres no ar para
rodar o teste de uma função pura é atrito desnecessário, e "pular silenciosamente quando
o banco não responde" produz suíte verde que não testou nada.

`fileParallelism: false` no `vitest.config.mts` porque os testes de banco compartilham
schema — em paralelo, um apagaria o cenário do outro.

### 6.11 Pré-popular `nivel` (a dúvida da seção 4.4)

A arquitetura deixou em aberto: pré-popular `nivel` ao criar o ciclo, ou inserir sob
demanda? **O `seed-dev` pré-popula**, e a matriz assume isso — `matrizDoCiclo()` lê
`nivel` e monta a grade, e `gravarNivel()` faz `UPDATE`, não `UPSERT`.

**Isto ainda não é uma decisão fechada**, porque a função de abrir ciclo não existe. Ao
escrevê-la, decida de vez — e se mantiver o pré-populado, será preciso uma
`sincronizar_ciclo(ciclo_id)` chamada ao cadastrar tarefa nova no meio do ciclo, senão a
tarefa nova não aparece na grade.

### 6.12 Detalhes de interface

- **Clique no segmento `k` quando o valor já é `k` volta para `k-1`.** Dá um caminho de
  mouse até o zero sem depender de teclado.
- **Célula não avaliada é tracejada**, não cinza-claro. Precisa ser distinguível de
  "avaliada com zero" à primeira vista.
- **`referenciaTitulo()` em vez de `capitalize` do CSS.** O `capitalize` maiusculiza cada
  palavra e produz "Outubro **De** 2026".

---

## 7. Investigações e problemas resolvidos

Anotados para não serem redescobertos.

| Problema | Causa | Solução |
|---|---|---|
| `npm i -D vitest` falhava com ERESOLVE | O template do `create-next-app` fixa `@types/node@^20`; vitest 5 exige `^22 \|\| >=24` | `npm i -D @types/node@^22` |
| Seed não enxergava `DATABASE_URL` mesmo com `dotenv/config` | O `tsx` transpila para CJS e iça os `require` acima da chamada do dotenv | `tsx --env-file=.env.local` (nativo do Node 22). O `dotenv` foi desinstalado |
| `f_semaforo_simulado` dava erro de sintaxe | Drizzle expande `${arrayJS}` como **lista de parâmetros** (`$2, $3, …`), e array vazio virava `()` | `sql.param(ids)` para passar como valor único |
| A home era prerenderizada estaticamente no build | Next 16 não considera dinâmica uma chamada ao Postgres via `postgres-js` | `export const dynamic = 'force-dynamic'` |
| `tsc --noEmit` reclamava de `LayoutProps` | O tipo é gerado pelo Next em `.next/types` | Rodar `npm run build` ou `npm run dev` uma vez |
| `browser-harness` não subia | Nenhum Chrome rodando com depuração remota | Chrome headless com `--user-data-dir` isolado na porta 9333 — **não toca no seu perfil** |
| Eixo do gráfico mostrava `2026-08-01` e cortava o último rótulo | Rótulo cru e margem direita de 8px | `referenciaCurta()` (`ago/26`) e margem de 28px com `textAnchor` nas pontas |

### 7.1 Vulnerabilidades conhecidas e deliberadamente não corrigidas

`npm audit` reporta **4 vulnerabilidades moderadas em `esbuild`**, transitivas de
`drizzle-kit` (via `@esbuild-kit/core-utils`). Afetam apenas o **dev-server do esbuild**,
não a aplicação. O `npm audit fix --force` rebaixaria `drizzle-kit` de 0.31 para 0.18 —
troca ruim. Reavaliar quando o drizzle-kit atualizar a dependência.

---

## 8. Verificações feitas — e como reproduzir

Nada aqui foi assumido a partir da inspeção de HTML. As interações foram testadas em
Chrome headless via CDP.

| O que foi verificado | Resultado |
|---|---|
| **A gravação funciona ponta a ponta** | Digitar `2` numa célula: a UI mudou na hora, a cobertura recalculou de 76,04% para 75,78%, apareceu "salvo às 10:09". O banco gravou `valor=2, avaliado=t, atualizado_por=Alexandre, origem=gestor` |
| **A view SQL concorda com a função pura do navegador** | A `v_cobertura_departamento` devolveu **exatamente** 75,78% — o mesmo número que `lib/dominio/cobertura.ts` calculou no cliente |
| **Ciclo fechado é imutável no servidor, não só na UI** | Carreguei a matriz editável, fechei o ciclo por SQL por trás da aplicação, e digitei. O servidor recusou, a mensagem apareceu, o valor voltou e **o banco não foi tocado** |
| **Modo leitura em ciclo fechado** | `tabIndex = -1`, botões `disabled`, barra diz "modo leitura", tecla não altera nada |
| **Navegação por teclado** | →, ←, ↓, `Home`, `End` movem corretamente; ↑ na primeira linha não perde o foco |
| **Rotas** | `/`, `/matriz/3`, `/painel/3`, `/simulador/3`, `/simulador/3?ausentes=2&ausentes=3`, `/evolucao` → 200. `/painel/999` → 404 |
| **Seed idempotente** | Segunda execução: "0 inseridas agora, o restante já existia" |
| **Testes de banco não deixam resíduo** | Depois de `test:all`: 1 departamento, 5 colaboradores, 64 tarefas |
| **`docker compose config`** | Passa |
| **`npm run build`** | Compila; as 5 rotas saem como `ƒ (Dynamic)` |
| **`npm run lint`** | Limpo |

**Para reproduzir o teste de navegador**, se precisar:

```bash
google-chrome --headless=new --remote-debugging-port=9333 \
  --user-data-dir=/tmp/chrome-teste --no-first-run &
BU_CDP_URL=http://127.0.0.1:9333 browser-harness <<'PY'
new_tab("http://localhost:3000/matriz/3")
wait_for_load()
print(page_info())
PY
```

### 8.1 O que NÃO foi verificado

- **Nada foi executado em contêiner de aplicação.** O `Dockerfile` nunca foi construído.
  O `compose.yml` só passou pela validação de sintaxe.
- **O `backup.sh` nunca rodou**, e portanto o restore nunca foi testado. A seção 14.4 da
  arquitetura é enfática: backup nunca testado tem alta probabilidade de não funcionar
  exatamente quando precisar.
- **Nenhum teste em navegador móvel ou em tela estreita.** A matriz tem `overflow-x-auto`,
  mas o comportamento real em telefone não foi observado.
- **Concorrência não foi testada.** Dois gestores editando a mesma célula ao mesmo tempo:
  o último `UPDATE` vence, sem aviso. Nesta escala provavelmente não importa, mas está
  aqui para não virar surpresa.

---

## 9. Dados: o que é real e o que é inventado

### 9.1 ⚠️ Os níveis são sintéticos

| Dado | Origem | Confiável? |
|---|---|---|
| 7 setores | Seção 5 da documentação funcional | ✅ Real |
| 64 tarefas, com descrição e periodicidade | Seção 5 da documentação funcional | ✅ Real, com textos padronizados |
| Pesos de criticidade | **Arbitrados por mim** | ⚠️ Não validados |
| 5 colaboradores (nomes) | Seção 3.2 da documentação funcional | ✅ Reais |
| Papel de cada um (Alexandre = gestor) | **Inventado** | ⚠️ Só para a sessão de desenvolvimento ter um gestor |
| 3 ciclos (ago, set, out/2026) | **Inventados** | ⚠️ |
| 960 células de nível | **Geradas por RNG determinístico** em `scripts/seed-dev.ts` | ⚠️ **Não são a matriz real** |

O gerador é determinístico (mesma semente → mesma matriz), e cria de propósito um caso
que reproduz a inconsistência 7: **Maykon fica com 64 células não avaliadas no ciclo
aberto**, para que a interface tenha o que sinalizar.

**Consequência prática: o Marco 1 não pode ser feito com estes dados.** A comparação com
a planilha — que a arquitetura chama de "a melhor demonstração de valor disponível no
projeto inteiro" — exige a matriz de verdade. Duas formas de obtê-la:

1. **Digitar na própria ferramenta.** A matriz já grava; são 320 células e, com teclado,
   isso leva menos de meia hora. Tem o efeito colateral bom de já ser um teste de uso.
2. **Escrever o leitor de `.xlsx`** (opção B da seção 11.4). A arquitetura deixou
   anotações prontas do layout na seção 11.5, incluindo as posições das colunas de cada
   colaborador e a função `nivelDaLinha()`.

### 9.2 Estado atual do banco

Contêiner `semaforo-db`, volume `semaforo-pgdata`, porta 5432.

| Tabela | Linhas |
|---|---|
| `departamento` | 1 — "Fiscal / Faturamento / Financeiro" |
| `setor` | 7 |
| `tarefa` | 64 |
| `colaborador` | 5 |
| `ciclo` | 3 (ids 1, 2, 3 — ago/26 e set/26 fechados, out/26 aberto) |
| `nivel` | 960 (3 ciclos × 64 tarefas × 5 pessoas) |
| `autoavaliacao` | 0 |

Os ids dos ciclos são **1, 2 e 3** — é o que as URLs usam (`/matriz/3` é outubro).

---

## 10. O que falta, em ordem de dependência

### 10.1 🔴 Login — ADR-005, etapa 4 item 2

**O maior bloqueador.** Hoje `lib/auth/sessao.ts` devolve um usuário fixo: **qualquer
pessoa que alcance o servidor escreve na matriz como gestor.** Aceitável em localhost,
inaceitável em qualquer máquina que outra pessoa alcance — os dados aqui são avaliação
de desempenho usada para promoção e desligamento.

**O que já está pronto:** toda a camada de permissões, escrita e testada. Falta apenas
responder "quem é a pessoa".

**O que fazer:**

1. Decidir o provider. A arquitetura recomenda LDAP se houver AD local, Credentials caso
   contrário. **Pergunta em aberto: existe AD local na empresa?**
2. Se for Supabase, o `colaborador.auth_user_id` (uuid) já existe para o vínculo.
3. Implementar `usuarioAtual()` de verdade, mantendo a mesma assinatura — nenhuma tela
   precisa mudar.
4. **Virar `AUTENTICACAO_IMPLEMENTADA` para `true`**, senão o build de produção se recusa
   a subir.
5. Bloquear login de colaborador com `saida_em` preenchido (mitigação da seção ADR-005).

### 10.2 🔴 Abrir e fechar ciclo pela interface — etapa 4 item 1

Hoje os ciclos existem só porque o `seed-dev` os criou. Não há como virar o mês.

**O que fazer:**

1. Server Action `abrirCiclo(departamentoId, referencia)`:
   - cria o `ciclo`;
   - copia os valores de `nivel` do ciclo anterior **zerando `avaliado`** (decisão 7.4);
   - resolve de vez a dúvida 6.11 (pré-popular ou não).
2. Server Action `fecharCiclo(cicloId)` — com confirmação, porque torna tudo imutável.
   Preencher `fechado_em` e `fechado_por`.
3. Reabertura: a arquitetura diz que deve ficar registrada. O schema **ainda não tem
   campo para isso** — hoje reabrir é só `status = 'aberto', fechado_em = null`, e a
   informação de que houve reabertura se perde. Precisa de decisão: bastam os campos
   atuais, ou entra uma tabela de auditoria?
4. Se uma tarefa nova for cadastrada no meio do ciclo, ela precisa aparecer na grade —
   ver a `sincronizar_ciclo()` mencionada em 6.11.

### 10.3 🔴 CRUD de administração — `/admin`, etapa 3 item 4

É o **objetivo 1** da documentação, e o contraste vale a demonstração: hoje incluir uma
tarefa na planilha exige inserir linha, replicar as fórmulas do semáforo e corrigir à mão
os intervalos das fórmulas de setor. No sistema é um formulário com três campos.

Telas: tarefas, setores, pessoas. **Lembre do ADR-009:** tarefa nunca é deletada — o
"excluir" preenche `ativa_ate`.

### 10.4 🔴 Deploy — etapa 1 item 2

A arquitetura insiste que isso seja feito **cedo, não no fim**, e já está atrasado em
relação à ordem recomendada. Os arquivos existem; falta o servidor.

**Perguntas que bloqueiam:** existe servidor interno disponível? Quem o administra? Se
for a TI, converse antes, não depois.

**Passos:** gerar os três segredos (`docker/secrets/README.md`), definir o nome interno
no `Caddyfile`, `docker compose build`, `docker compose run --rm app npx drizzle-kit migrate`,
`docker compose up -d`. Depois: **testar o restore do backup** antes de confiar nele.

### 10.5 🔴 Autoavaliação do colaborador — etapa 5

A tela `/minha-avaliacao` e a fila de aprovação do gestor. Elimina o passo 3 do processo
de elaboração ("gestor compila as tarefas em duplicidade"), que é trabalho puramente
mecânico.

A tabela `autoavaliacao` já existe no schema e está vazia. Fica por último de propósito:
o gestor consegue usar o sistema inteiro sem ela.

### 10.6 🟡 Itens menores, alto valor por esforço

- **Tela "quem pode me ensinar isso"** — escolho a tarefa, vejo quem está em nível 4. É o
  objetivo 5 materializado, é barato, e é o recurso que faz o colaborador abrir a
  ferramenta por vontade própria.
- **`pontuacao_historica`** — os 66 números da aba `Gráfico` (6 pessoas × 11 períodos)
  estão reproduzidos na seção 4.1 da documentação funcional. Digitados numa tabela, dão
  14 meses de história ao gráfico de evolução sem nenhum importador. Custa uma hora.
- **Teste de regressão do cenário real** (seção 13, item 3) — depende de ter dados reais.

---

## 11. Perguntas em aberto

### 11.1 Para o gestor — mudam fórmulas ou schema

1. **A cobertura pode passar de 100%?** Implementado como **opção A** (`least(n,3)`).
   ⚠️ **Os percentuais vão divergir dos que ele já apresentou.** Mostre antes, depois e
   **a causa**, lado a lado — a causa é o que convence.
2. **A meta de 3 muda se o departamento tiver 3 pessoas?** Com 3 pessoas, 100% exige que
   todos dominem tudo em nível 4, o que é irreal. `min(3, n-1)` tornaria o indicador
   incomparável entre departamentos, o que atrapalha o objetivo 9. Sem resposta boa.
3. **Validar a fórmula de `criticidade()` e os pesos de 6.3.** Enquanto não validada, ela
   **só ordena** a lista de ação e não deve virar indicador publicado.
4. **Tarefa pode pertencer a mais de um setor?** Hoje não. "Análise de impostos e
   tributações das operações em geral" parece transversal.
5. **A diretoria vê nome de pessoa ou só o agregado por setor?** Muda a tela e tem
   implicação de privacidade.
6. **O que acontece com a pontuação de quem entra no meio do ciclo?**
7. **Como registrar que alguém foi treinado numa tarefa**, e não só que o nível mudou?
   Provavelmente é o próximo produto, não este.

### 11.2 Para a TI / infraestrutura

8. **Existe AD local (Active Directory on-premise)?** Decide o ADR-005.
9. **Existe servidor interno disponível, e quem o administra?** Se for você, a seção 14
   da arquitetura é trabalho seu, recorrente.
10. **Existe SMTP interno?** Bloqueia a funcionalidade de alertas do backlog.

### 11.3 Técnicas, para decidir ao escrever o código

11. **Pré-popular `nivel` ou inserir sob demanda?** (6.11) — decida ao escrever o abrir
    ciclo.
12. **Registrar reabertura de ciclo** — o schema hoje não tem onde. (10.2)
13. **Declarar as views no schema Drizzle** como tabelas somente leitura, para recuperar
    a tipagem que o ADR-008 custa. Hoje as consultas usam `db.execute` com o tipo
    declarado à mão — funciona, mas nada impede que o tipo e a view divirjam.

---

## 12. Riscos ativos

Por ordem do que mais provavelmente vai dar errado. Adaptado da seção 15 da arquitetura,
com o estado real.

| Risco | Probabilidade | Impacto | Situação hoje |
|---|---|---|---|
| **Projeto parar no meio** | **Alta** | Total | Sem prazo e **sem nenhum marco atingido**, ninguém está esperando por isso ainda. É o risco número um. A defesa é o Marco 1 — e ele está a uma matriz digitada de distância |
| **A aplicação subir sem login** | Média | **Grave** | Mitigado pela trava de 6.9, que faz o build de produção falhar. Mas trava é lembrete, não solução |
| **Ninguém usar depois de pronto** | Média | Total | O simulador está pronto e é o candidato a "recurso sem o qual não se vive". Ainda não foi mostrado a ninguém |
| **Gestor desconfiar dos números diferentes** | Alta | Médio | Ainda não aconteceu porque a comparação não foi feita. Quando for: antes, depois e a causa, lado a lado |
| **Backup nunca testado** | Alta | **Grave** | O script existe e nunca rodou. Os dados deste sistema não são recuperáveis por redigitação |
| **Crescimento de escopo** | Alta | Médio | `BACKLOG.md` existe desde o primeiro dia |
| **Decisão de nuvem mudar no meio** | Média | Médio | O schema é portátil por disciplina (ADR-011). O que muda é auth e permissões. Ver 3.2 |

---

## 13. Histórico

### Sessão de 28 de setembro de 2026

Do zero à aplicação funcionando. Ordem do que foi feito:

1. Leitura dos três documentos do repositório e do estado da máquina.
2. Instalação de `podman-compose`, `podman-docker` e `docker-compose`. Decisão de usar
   Podman com compatibilidade Docker (3.1). `psql` deliberadamente não instalado.
3. `create-next-app` em `semaforo/`, dependências, Postgres 17 em contêiner.
4. `lib/dominio/` com 16 testes — antes de qualquer tela.
5. Schema Drizzle, migration `0000`, camada de cálculo em `0001`.
6. Catálogo real (7 setores, 64 tarefas) e seed idempotente.
7. Seed de desenvolvimento com 3 ciclos e 960 células sintéticas.
8. `/painel` — primeira tela de leitura.
9. `lib/auth/permissoes.ts` com 13 testes, e o marcador de sessão com a trava de 6.9.
10. `/matriz` — controle de 4 segmentos, teclado, salvamento otimista, semáforo ao vivo.
11. `/simulador` e `/evolucao`.
12. 10 testes das views contra cenário calculado à mão.
13. `Dockerfile`, compose, Caddy, backup e deploy.
14. Verificação em navegador real: gravação, imutabilidade de ciclo fechado, teclado.
15. Correção de dois defeitos que a verificação visual revelou (capitalize, eixo do
    gráfico).

**Resultado:** 39 testes passando, build e lint limpos, 5 rotas servindo 200.

### Como manter este arquivo

Ao fechar uma sessão de trabalho, atualize:

- a tabela da **seção 1** (estado das etapas e marcos);
- a **seção 4**, se arquivos foram criados ou removidos;
- a **seção 6**, se uma decisão nova foi tomada — **especialmente se ela contraria a
  arquitetura**;
- a **seção 7**, se algo custou mais de meia hora para descobrir;
- a **seção 8**, com o que foi verificado e como;
- a **seção 10**, removendo o que foi feito e detalhando o que apareceu;
- a **seção 13**, com uma entrada nova.

O `BACKLOG.md` dentro de `semaforo/` continua sendo a fila de ideias soltas. **Este
arquivo é a fonte de verdade sobre o estado.** Quando os dois discordarem, este vale.
