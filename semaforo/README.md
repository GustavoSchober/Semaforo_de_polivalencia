# Semáforo de Polivalência — aplicação

Implementação do sistema descrito em `../arquitetura-semaforo-de-polivalencia.md`.
A planilha na raiz do repositório é **especificação, não fonte de dados**.

## Stack

Next.js 16 (App Router) · TypeScript · Drizzle ORM · PostgreSQL 17 · Tailwind 4

O contêiner do banco roda em **Podman** (rootless). O compose da seção 14 da
arquitetura continua válido — com `podman-docker` instalado, o comando `docker`
aponta para o Podman e o arquivo não precisa de alteração.

## Subir do zero

```bash
cp .env.example .env.local     # ajuste se necessário
npm install
npm run db:up                  # Postgres 17 em contêiner
npm run db:migrate             # schema + camada de cálculo
npm run db:seed                # 7 setores e 64 tarefas — o catálogo real
npm run db:seed-dev            # níveis SINTÉTICOS, só para desenvolver
npm run dev
```

`db:seed` é idempotente: pode rodar quantas vezes quiser.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes puros: domínio e permissões (não precisa de banco) |
| `npm run test:db` | Testes das views contra um cenário calculado à mão |
| `npm run test:all` | Os dois |
| `npm run db:generate` | Gera migration a partir de `lib/db/schema.ts` |
| `npm run db:migrate` | Aplica as migrations pendentes |
| `npm run db:studio` | Inspetor visual do banco |
| `npm run db:up` / `db:down` | Liga e desliga o Postgres |

Para abrir um `psql` sem instalar nada no host:

```bash
podman exec -it semaforo-db psql -U semaforo -d semaforo
```

## Onde cada coisa mora

```
lib/dominio/       funções puras, sem nenhum import. É onde a planilha erra.
lib/auth/          permissões (reais e testadas) e sessão (ainda um marcador).
lib/db/schema.ts   as 7 tabelas. O CHECK de 0..4 é o coração do projeto.
lib/db/catalogo.ts o catálogo inicial, digitado da seção 5 da documentação.
lib/db/consultas/  uma função por PERGUNTA DE NEGÓCIO, não por tabela.
drizzle/0001_...   as views e a função de simulação. A camada de cálculo.
lib/db/ciclo-vigente.ts  a virada automática do mês. Sem cron: no primeiro
                   acesso do mês novo, fecha o anterior e herda os níveis.
app/globals.css    os tokens e TODOS os materiais. Dois temas moram aqui.
app/componentes/   o kit: moldura, palheta, farol, contador, aviso, explicação,
                   tema, ícones.
app/gerenciar/     cadastro de pessoas, catálogo de tarefas e ciclos.
app/matriz/        a grade editável (seção 9.1) — a tela que decide o projeto.
app/painel/        o painel de risco (seção 9.2).
app/simulador/     a simulação de ausência (seção 9.3).
app/evolucao/      pontos e cobertura ao longo dos ciclos (seção 9.4).
docker/            compose, Caddy, backup e deploy (seção 14).
```

**Uma coisa nunca muda de lugar: o vínculo pessoa ↔ tarefa.** Ele é a tabela
`nivel`, e mais nada. "Quantas pessoas executam" e "quantas ensinam" são
contados a partir dela em `v_nivel_vigente`, na hora da leitura — nunca
digitados, nunca guardados. É por isso que desligar alguém repercute em todas as
telas sem que nada precise ser atualizado à mão. Quem saiu para de contar do mês
corrente em diante e continua nos meses fechados, porque a view filtra por
`saida_em >= referencia` e não por `saida_em is null`.

**O mundo visual tem regras próprias, e elas estão escritas.** `DESIGN.md` é o
registro do sistema como ele foi construído; `.impeccable/surfaces/app.md` guarda
a direção que o originou. Duas leis valem mais que o gosto de quem edita: âmbar e
vermelho pertencem ao **risco** e só aparecem onde a regra do farol dispara; aço
pertence à **confiança** e é o único canal de dado incerto. Aviso nunca é âmbar.

**`lib/dominio/` não importa nada** — nem banco, nem React, nem Next. Se uma
função dessa pasta precisar importar alguma coisa, ela está no lugar errado.

## Regras que valem mais que o código

1. **Nenhuma alteração de schema feita direto no banco.** Sempre migration, sempre
   no git. O git é a única memória do schema (ADR-004).
2. **Nada que seja calculável é armazenado.** O banco guarda uma única coisa: o
   nível de cada pessoa, em cada tarefa, em cada ciclo.
3. **Ciclo fechado é imutável**, inclusive para o gestor.

## Telas

| Rota | O que é |
|---|---|
| `/` | Lista de ciclos com a cobertura de cada um |
| `/matriz/[ciclo]` | A grade: 64 tarefas × 5 pessoas, teclado, gravação automática |
| `/painel/[ciclo]` | Cobertura, plano de ação, falsa sensação de segurança |
| `/simulador/[ciclo]` | E se essas pessoas saírem — com a tabela de cada um sozinho |
| `/evolucao` | Pontos por colaborador e cobertura do departamento entre ciclos |
| `/gerenciar` | Equipe: cadastrar, editar, desligar e readmitir |
| `/gerenciar/catalogo` | Catálogo: cadastrar, editar e tirar tarefa de vigência |
| `/gerenciar/catalogo/[tarefa]` | Quem faz aquela tarefa, na escala 0 a 4 |
| `/gerenciar/ciclos` | Ciclos, e o fechar/reabrir manual |

## Estado atual

> O inventário completo, as decisões tomadas, as investigações e o ponto exato de
> retomada estão em **`../ESTADO-DO-PROJETO.md`**. O resumo abaixo é só um índice.

Etapas 1 a 3 da ordem de construção, menos o deploy e o CRUD de administração.

- [x] Projeto, Drizzle, Postgres em contêiner
- [x] Schema com todos os `CHECK` da seção 4
- [x] Camada de cálculo em views, verificada por teste (seção 5 e 13)
- [x] Seed dos 7 setores e 64 tarefas
- [x] Matriz editável: teclado, salvamento otimista, semáforo ao vivo
- [x] Painel de risco, simulador de ausência, tela de evolução
- [x] Permissões escritas e testadas (`lib/auth/permissoes.ts`)
- [x] Arquivos de deploy: Dockerfile, compose, Caddy, backup (seção 14)
- [x] Cadastro de pessoas e tarefas pela interface, com desligamento e vigência
- [x] Virada automática do mês, com herança de níveis declarada como herança
- [x] Modo claro — a folha de horários impressa, ao lado do painel
- [ ] **Login** — `lib/auth/sessao.ts` devolve um usuário fixo (ADR-005, etapa 4)
- [ ] **Deploy no servidor, mesmo com a aplicação vazia** — a arquitetura insiste
      que isso seja feito cedo, não no fim
- [ ] CRUD de **setor** (pessoa, tarefa e ciclo já têm tela)
- [ ] Autoavaliação do colaborador e fila de aprovação (etapa 5)
- [ ] Marco 1: a comparação com a planilha, levada ao gestor

> **Não há autenticação.** Qualquer pessoa que alcance o servidor escreve na
> matriz como gestor. Isso é aceitável em localhost e inaceitável em qualquer
> máquina que outra pessoa alcance — os dados aqui são avaliação de desempenho
> usada para promoção e desligamento. A aplicação se recusa a subir em
> `NODE_ENV=production` justamente por isso.

> **O Marco 1 exige a matriz real**, digitada pelo gestor. Os dados de
> `db:seed-dev` são sintéticos e não servem para essa conversa.
