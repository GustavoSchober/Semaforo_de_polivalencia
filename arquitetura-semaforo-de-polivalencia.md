# Semáforo de Polivalência — Arquitetura e Plano de Construção

**Documento companheiro de:** `documentacao-semaforo-de-polivalencia.md`
**Tipo:** decisões de arquitetura, modelo de dados e roteiro de implementação
**Stack:** Next.js + TypeScript + Postgres, **tudo on-premise, sem serviço de nuvem**
**Destino:** ferramenta interna da empresa
**Prazo:** sem data de entrega definida — ver seção 12
**Revisão:** 2 (setembro de 2026)

---

## 0. Como usar este documento

Este arquivo não repete o que já está na documentação funcional. Lá está **o que a ferramenta
faz e por quê**; aqui está **como ela vira software e por que cada escolha foi feita assim**.

Os dois se leem em conjunto:

| Pergunta | Onde procurar |
|---|---|
| O que significa nível 3? Por que 3 pessoas é a meta? | Documentação funcional, seções 3 e 6 |
| Por que o nível virou um inteiro no banco? | Aqui, seção 2 |
| Quais tarefas existem? | Documentação funcional, seção 5 |
| Como o catálogo de tarefas é modelado? | Aqui, seções 4 e 3 (ADR-009) |
| Qual o percentual de cobertura hoje? | Documentação funcional, seção 7 |
| Como esse percentual é calculado no sistema? | Aqui, seção 5 |

**As decisões aqui não são definitivas.** Cada uma está escrita no formato "contexto → decisão →
por quê → alternativas descartadas → consequências", justamente para que, quando você quiser
mudar de ideia daqui a três semanas, saiba exatamente o que está desfazendo e o que vai quebrar
junto. Mudar de ideia com o raciocínio à vista é barato; mudar de ideia sem ele é o que gera
retrabalho.

Onde eu tiver dúvida legítima, vou dizer que tenho dúvida em vez de fingir convicção.

### Três premissas que valem explicitar

Elas mudaram durante a conversa e mudam várias decisões deste documento:

1. **A planilha é referência, não fonte de dados.** Ela mostra como o processo funciona hoje e
   qual é o resultado esperado. Não há compromisso de importá-la. Ver seção 11.
2. **Não há prazo.** Nenhuma data foi prometida a ninguém. A seção 12 é uma **ordem de
   construção**, não um cronograma.
3. **Sem nuvem.** Tudo roda em infraestrutura da empresa. Isso está refletido nos ADRs 003, 005,
   006 e 011, e na seção 14.

---

## 1. O problema, em uma frase

A planilha funciona. O problema não é que ela esteja errada — é que **ela erra silenciosamente**,
e o custo de mantê-la correta cresce a cada mês.

A seção 8 da documentação funcional lista dez inconsistências. Vale olhar para elas como classes
de problema, não como dez bugs isolados:

| Classe | Inconsistências | Causa raiz |
|---|---|---|
| Intervalo de fórmula escrito à mão | 1, 2, 3 | "Quais linhas são do setor X" é conhecimento que mora no texto da fórmula, não nos dados |
| Estado inválido possível | 8, 9 | A célula aceita qualquer número; nada impede um `2` ou um `11` |
| Ritual manual de virada de mês | 5, 6, 7 | Duplicar aba, renomear, ocultar, acrescentar coluna no gráfico, revisar séries — cinco passos, nenhum verificado |
| Dado sem tipo | 4, 10 | `Diario`, `Dia 10` e `Junho` convivem na mesma coluna; texto livre acumula erro de digitação |

Nenhuma dessas classes se resolve com mais disciplina do gestor. Todas se resolvem sozinhas
quando os dados ganham estrutura. **É isso que justifica o projeto** — não "modernizar", não
"tirar do Excel", mas tornar impossível o erro que hoje é apenas improvável.

E há um ganho positivo, não apenas defensivo: a simulação de ausência (objetivo 7) hoje é
teoricamente possível e praticamente inexistente, porque custa meia hora de cópia de abas. Em
software custa 200 milissegundos. Recursos que custam meia hora não são usados; recursos que
custam 200ms viram hábito.

---

## 2. A virada conceitual

Esta seção é a mais importante do documento. Se você só ler uma parte, leia esta.

### 2.1 As quatro colunas não são quatro campos

Na planilha, cada colaborador ocupa quatro colunas por tarefa, preenchidas com `1` da esquerda
para a direita. Parece uma estrutura de quatro valores booleanos. **Não é.**

Como o preenchimento é cumulativo e obrigatoriamente contíguo (regra 2 da seção 6 da documentação
funcional: *"nível 3 significa três células marcadas, nunca uma marcação isolada na terceira
coluna"*), só existem cinco estados possíveis:

```
▢▢▢▢  = 0   não sabe
▉▢▢▢  = 1   aprendendo
▉▉▢▢  = 2   faz com ajuda
▉▉▉▢  = 3   faz sozinho
▉▉▉▉  = 4   faz e ensina
```

Quatro booleanos comportariam 16 combinações. Doze delas são inválidas e a planilha não tem como
recusá-las. Um único inteiro de 0 a 4 comporta exatamente os cinco estados que existem.

**Consequência imediata:** a inconsistência 8 deixa de ser um problema a resolver e passa a ser
um problema que não pode acontecer:

```sql
valor smallint not null check (valor between 0 and 4)
```

Essa é a diferença entre validação (o sistema checa e reclama) e **modelagem correta** (o estado
inválido não é representável). Sempre que der para escolher a segunda, escolha a segunda.

### 2.2 O semáforo fica bonito

Aqui a escolha do inteiro paga um dividendo inesperado. As quatro colunas do semáforo (AG:AJ na
planilha) perguntam "quantas pessoas atingiram o nível k". Como o nível é cumulativo, quem está
no nível 4 também atingiu o 1, o 2 e o 3. Logo:

> **quantas pessoas no nível k** = `count(*) where valor >= k`

Não é uma soma de células espalhadas por cinco blocos de colunas. É uma contagem com filtro. Em
SQL:

```sql
count(*) filter (where valor >= 1) as nivel_1,
count(*) filter (where valor >= 2) as nivel_2,
count(*) filter (where valor >= 3) as nivel_3,
count(*) filter (where valor >= 4) as nivel_4
```

Quando a modelagem está certa, as consultas ficam curtas. Quando você se pegar escrevendo uma
consulta longa e cheia de casos especiais, desconfie da modelagem antes de desconfiar da consulta.

### 2.3 Nada que seja calculável é armazenado

Esta é a regra de ouro do projeto.

O banco guarda **uma única coisa**: o nível de cada pessoa, em cada tarefa, em cada ciclo. Todo o
resto é derivado na hora da leitura:

- semáforo por tarefa e nível
- percentual de cobertura por setor
- indicador global do departamento
- total de pontos do colaborador
- evolução mês a mês
- simulação de ausência
- lista de tarefas críticas

A planilha faz o contrário: ela **armazena o cálculo** dentro de células. Por isso `AM4` soma as
linhas erradas há meses sem que ninguém perceba — o cálculo é um dado, e dados desatualizam.

Quando o cálculo é uma função do dado, ele não pode desatualizar. A pergunta "quais linhas
pertencem a Apuração Tributária" deixa de ser um intervalo digitado (`AG60:AJ65`) e passa a ser
`where setor_id = 3`. O agrupamento é uma propriedade da tarefa, não da sua posição na tela.

### 2.4 Tradução direta das inconsistências

| # | Inconsistência na planilha | O que acontece com ela |
|---|---|---|
| 1 | `AM4` soma o intervalo de outro setor | **Deixa de existir.** `GROUP BY setor_id` |
| 2 | `AM3` exclui a linha 52 | **Deixa de existir.** Mesma causa |
| 3 | Divisor `280` conta linhas em branco | **Deixa de existir.** `count(*)` conta tarefas, e linha em branco não é tarefa |
| 4 | Linha 37 com fórmula e sem tarefa | **Deixa de existir.** Não há "linha", só registro |
| 5 | Aba `Gráfico` sem outubro, sem José Junior, com Kevin e Loraine | **Deixa de existir.** O gráfico é consulta sobre ciclos, não tabela mantida à mão |
| 6 | Gráfico plota 3 das 6 séries | **Deixa de existir.** Mesma causa |
| 7 | Luis e Maykon zerados sem motivo | **Vira visível.** Campo `avaliado` distingue "é zero" de "ninguém preencheu" (ver 4.3) |
| 8 | Sem validação de dados | **Deixa de existir.** `CHECK (valor between 0 and 4)` |
| 9 | Cobertura pode passar de 100% | **Vira decisão consciente.** Ver seção 7.1 |
| 10 | `Diario` sem acento, `manuntenção`, `Luis ` com espaço | **Deixa de existir para enums**, permanece para texto livre |

Sete das dez somem por consequência da modelagem, sem uma linha de código defensivo. Isso é o
indício de que o modelo está certo.

---

## 3. Decisões de arquitetura

Formato: contexto, decisão, por quê, o que foi descartado, o que isso custa.

### ADR-001 — Aplicação web, não desktop nem planilha melhorada

**Contexto.** Poderíamos ter melhorado a própria planilha (validação de dados, proteção de
fórmulas, tabelas nomeadas). Seria muito mais barato.

**Decisão.** Aplicação web multiusuário, servida pela rede interna da empresa.

**Por quê.** Três requisitos da documentação funcional não sobrevivem em arquivo:

1. **Objetivo 5** exige que os colaboradores vejam o quadro uns dos outros, e a documentação diz
   explicitamente que isso *"depende de como o arquivo é compartilhado"*. Arquivo compartilhado
   significa uma de duas coisas: cópia que desatualiza, ou arquivo único com risco de edição
   acidental. Web resolve os dois.
2. **O processo de elaboração** (passos 1 a 4) tem dois atores com permissões diferentes:
   colaborador declara, gestor valida. Isso é fluxo com papéis, não é planilha.
3. **Objetivo 9** prevê consolidação entre departamentos. Consolidar arquivos é exatamente o tipo
   de coisa que funciona nos dois primeiros meses e depois vira uma pessoa copiando e colando.

"Web" aqui não implica internet. Implica navegador e servidor — e o servidor pode ser uma máquina
na sala ao lado, que é exatamente o plano (ADR-011).

**Descartado.** Planilha turbinada (não atende 1 e 2); app desktop (instalação em cada máquina,
atualização manual, nenhuma vantagem aqui).

**Custo.** Semanas de trabalho contra horas.

---

### ADR-002 — TypeScript / Next.js, não Python

**Contexto.** Você está confortável com os dois. A escolha, então, não é de conforto, é de
adequação.

**Decisão.** Next.js (App Router) com TypeScript, um repositório só.

**Por quê.**

O coração funcional deste produto é **uma tela de grade interativa**: 64 tarefas × 5 colaboradores,
edição célula a célula, salvamento otimista, navegação por teclado, recálculo do semáforo ao vivo.
Isso é trabalho de frontend, e é a parte que decide se o gestor vai usar ou não a ferramenta.

Com Python você escreveria FastAPI ou Django REST **e ainda assim** um frontend React separado,
porque não existe versão boa dessa tela em template server-side. Resultado: dois projetos, dois
processos para manter no ar, um contrato de API para versionar, e tipos duplicados dos dois lados.

Com Next.js, o tipo que sai do banco chega tipado dentro do componente sem nada escrito no meio.
Para um projeto tocado por uma pessoa, eliminar a fronteira entre back e front não é elegância —
é trabalho que simplesmente não existe.

**Nota de honestidade sobre a revisão 2.** Na primeira versão deste documento, um dos argumentos
era que a Vercel é a casa do Next.js. Com a decisão de não usar nuvem, **esse argumento caiu**.
Reexaminei a escolha sem ele e ela continua de pé pelos motivos acima, que são os principais. Mas
vale registrar que Next.js auto-hospedado é um caminho um pouco menos trilhado que Next.js na
Vercel — funciona bem com `output: 'standalone'`, e a seção 14 detalha como, porém você vai
encontrar menos tutoriais quando algo der errado. É o preço consciente de sair da nuvem.

**Descartado.** FastAPI + React separado (duas bases de código); Django (ótimo admin, mas o admin
não é o produto aqui — o produto é a grade); Next.js com JavaScript puro (o domínio tem enums,
níveis e papéis, exatamente onde tipagem paga).

**Custo.** Se um dia o projeto ganhar componente analítico pesado — previsão de risco, otimização
de alocação de treinamento — Python seria melhor. Mitigação: nada impede um serviço Python
separado no futuro lendo o mesmo Postgres. A escolha não fecha essa porta.

---

### ADR-003 — Postgres em contêiner próprio, e por um motivo que não é escala

**Contexto.** O volume é minúsculo. 64 tarefas × 5 pessoas × 12 meses = cerca de 3.800 registros
por ano por departamento. Dez departamentos durante dez anos ainda cabe folgado em qualquer coisa.
SQLite daria conta com sobra, e simplificaria a operação porque é um arquivo.

**Decisão.** Postgres, rodando em Docker na infraestrutura da empresa.

**Por quê.** Não é escala. São quatro outras coisas:

1. **Integridade declarativa.** Chaves estrangeiras, `CHECK`, tipos `enum` e chave primária
   composta fazem o banco recusar estado inválido. É a materialização da seção 2.1.
2. **Concorrência real.** Vários colaboradores preenchendo autoavaliação ao mesmo tempo enquanto
   o gestor edita a matriz. SQLite trava o arquivo inteiro na escrita.
3. **Expressividade de consulta.** `count(*) filter (where ...)`, `least()`, window functions para
   evolução, CTEs para a simulação. Toda a camada de cálculo da seção 5 depende disso.
4. **Caminho para o objetivo 9.** Multi-departamento com filtro em vez de reescrita.

**Sobre ter cogitado Supabase e descartado.** O Supabase é Postgres com auth, storage e painel
acoplados. Sem nuvem, você fica só com o Postgres — que é justamente a parte que importa aqui.
As outras peças têm substituto local e estão resolvidas nos ADR-005 e ADR-006. Não se perde nada
relevante para este projeto.

**Descartado.** SQLite (concorrência, e nenhum `count(*) filter`); MySQL (sem `filter`, enums
piores, nada a ganhar); MongoDB (os dados são rigorosamente relacionais — tarefa pertence a setor,
nível referencia tarefa, colaborador e ciclo; document store aqui seria escolher a ferramenta
errada de propósito).

**Custo.** Alguém precisa cuidar do Postgres: subir, atualizar, fazer backup, monitorar disco.
Com Docker Compose isso é uma página de configuração (seção 14), mas é responsabilidade que na
nuvem seria de outra pessoa. **Sem nuvem, o sysadmin é você.**

---

### ADR-004 — Drizzle ORM, com as migrations no git

**Contexto.** É tentador criar as tabelas rodando SQL à mão no banco e seguir em frente.

**Decisão.** Drizzle, com o schema em TypeScript e as migrations versionadas no repositório.
**Nenhuma alteração de schema feita direto no banco.**

**Por quê.** Essa é a regra que mais gente quebra e mais dói depois. Se metade do schema nasceu de
SQL avulso e metade de migration, você perde a capacidade de recriar o banco do zero — e recriar o
banco do zero é exatamente o que você precisa para ter ambiente de desenvolvimento, ambiente de
teste, e para restaurar depois de um desastre.

Isso vale **mais ainda** sem nuvem: não existe um painel com histórico de alterações para
consultar depois. O git é a única memória do schema.

Drizzle especificamente, em vez de Prisma: gera SQL previsível e próximo do que você escreveria à
mão, o que importa porque as consultas deste projeto são agregações não triviais; e convive bem
com views e funções SQL, que aqui são a camada de cálculo inteira.

**Descartado.** Prisma (excelente ergonomia, mas abstrai demais para um projeto cujo valor está
nas agregações); SQL puro com `pg` (perde tipagem, e tipagem é metade da razão do ADR-002).

**Custo.** Curva de aprendizado se você nunca usou. É pequena, um dia no máximo.

---

### ADR-005 — Autenticação local, sem provedor de identidade em nuvem

**Contexto.** A empresa usa Microsoft 365, então o caminho mais confortável seria SSO pelo Entra
ID. Mas a decisão é não depender de nuvem.

**Decisão.** Auth.js (antigo NextAuth) rodando dentro da própria aplicação, com o provider
escolhido conforme o que a empresa tiver:

| Cenário | Provider | Observação |
|---|---|---|
| **A empresa tem AD local (Active Directory on-premise)** | LDAP | **Melhor opção.** Ninguém cria senha nova, e desligamento no AD corta o acesso aqui |
| **Não tem AD local** | Credentials com tabela própria | Senha com Argon2id. Você implementa criação e troca de senha |

**Decisão prática para começar: Credentials.** É o caminho que não depende de terceiros e que
você consegue fazer sozinho hoje. Se o AD local existir, trocar para LDAP é configuração, não
arquitetura — a tabela `colaborador` já prevê o vínculo por `auth_user_id`.

**Por quê o LDAP é preferível quando disponível.** Os dados aqui são **avaliação de desempenho de
pessoas, usada para promoção e desligamento** (objetivos 3, 6 e 8). Isso não é dado neutro. A
lista de quem tem acesso precisa acompanhar a lista de quem trabalha na empresa, e a única forma
de garantir isso é ela não ser uma segunda lista. Com senha própria, quando alguém é desligado,
alguém precisa lembrar de desativar o acesso aqui — e é exatamente o tipo de coisa que ninguém
lembra.

**Se ninguém lembrar, o desligado continua vendo a matriz de competências do departamento.**
Mitigação sem AD: uma rotina que bloqueia login de colaborador com `saida_em` preenchido, e um
lembrete no painel do gestor listando pessoas ativas sem movimentação há muito tempo.

**Nota sobre o Entra ID.** Vale registrar a nuance, porque a decisão é da empresa e não sua: usar
Entra ID como provedor de identidade **não coloca dado nenhum em nuvem** — os níveis, as tarefas e
os nomes continuam todos no seu Postgres. O que vai para fora é só a verificação de quem é a
pessoa, que já vai de qualquer jeito toda vez que alguém abre o Outlook. Se "zero nuvem" for uma
regra sobre onde os dados moram, o Entra ID não a viola. Se for uma regra sobre não depender de
serviço externo para o sistema funcionar, ele viola — sem internet, ninguém entra.

Não precisa decidir isso agora. Comece com Credentials e reveja quando o sistema estiver de pé.

**Descartado.** Supabase Auth (é nuvem); magic link por e-mail (depende de servidor SMTP e não
resolve o desligamento).

**Custo.** Com Credentials, você escreve tela de login, hash de senha, troca de senha e
provavelmente um "esqueci minha senha" que vira "peça ao gestor para resetar". É meio dia de
trabalho e uma superfície de segurança que você passa a ser responsável por não estragar.

---

### ADR-006 — Permissão em Server Actions; o banco nunca é exposto ao navegador

**Contexto.** Em arquiteturas com Supabase, o padrão é o navegador falar direto com o banco, com
Row Level Security garantindo segurança. Sem Supabase, essa opção some.

**Decisão.** O banco só aceita conexão da aplicação. Toda leitura e escrita passa por Server
Components e Server Actions, com a verificação de papel em TypeScript.

**Por quê.** Sem nuvem, isso fica mais simples do que era: **não existe chave anônima para vazar,
e o Postgres não precisa ser alcançável de fora do servidor.** No Docker Compose, o contêiner do
banco nem publica porta para a rede — só a aplicação, na rede interna do Compose, enxerga ele.

As regras deste domínio, de qualquer forma, não são do tipo "cada um vê só as próprias linhas",
que é onde RLS brilha. Elas são:

> Todo mundo vê a matriz inteira (objetivo 5 exige transparência). Só o gestor escreve na matriz.
> O colaborador escreve apenas na própria autoavaliação, apenas no ciclo aberto, e apenas enquanto
> ele ainda não foi aprovado. Ciclo fechado é imutável para todos.

Escrever isso como política SQL dá um bloco de `USING` e `WITH CHECK` que ninguém consegue reler
em três meses. Escrever em TypeScript dá uma função de dez linhas com nome, testável
unitariamente, que aparece no diff quando muda.

**Higiene mínima do banco, que substitui o papel de rede de segurança do RLS:**

- A aplicação conecta com um usuário Postgres **sem** `SUPERUSER` e sem permissão de `DROP`.
- As migrations rodam com um segundo usuário, com mais permissão, usado só nesse momento.
- O contêiner do banco não expõe porta para fora do host.

**Descartado.** RLS como controle primário (ilegível para estas regras e desnecessário quando o
banco não é público).

**Custo.** Nenhum relevante. Toda leitura passa pelo servidor, o que nesta escala é irrelevante e
para auditoria é desejável.

---

### ADR-007 — Ciclo mensal com snapshot completo, não event sourcing

**Contexto.** O ritual atual é duplicar a aba do mês, renomear e ocultar a anterior. Isso pode
virar, no banco, ou (a) uma cópia completa dos níveis por ciclo, ou (b) um log de eventos de
mudança, do qual o estado em qualquer data é derivado.

**Decisão.** Snapshot completo: uma linha em `nivel` para cada combinação de ciclo, tarefa e
colaborador.

**Por quê.**

- **Corresponde ao modelo mental do gestor.** Ele pensa em "a foto de outubro", e a documentação
  funcional trata isso como conceito central (regra 11: a aba do mês encerrado é congelada e serve
  de base de comparação). Modelo de dados que espelha o modelo mental do usuário gera menos bug de
  interpretação.
- **O custo é nulo.** 3.800 linhas por ano.
- **Consulta trivial.** "Cobertura de março" é `where ciclo_id = X`. Em event sourcing seria
  reconstruir estado até uma data, em toda consulta, para sempre.
- **Ciclo fechado é imutável**, o que dá a garantia que a planilha oferece por ocultar a aba — mas
  de verdade, e não por convenção.

**Descartado.** Event sourcing (sofisticação sem demanda aqui); manter só o estado atual (perde o
objetivo 6, que é metade do valor da ferramenta).

**Custo.** Não dá para responder "em que dia exatamente o Kevin passou de 2 para 3". Se isso virar
requisito, acrescenta-se uma tabela de auditoria `nivel_historico` — aditivo, não reescrita.

---

### ADR-008 — Cálculo em views SQL, não em TypeScript

**Contexto.** As agregações poderiam ser feitas puxando os níveis para a aplicação e somando em
JavaScript.

**Decisão.** Semáforo, cobertura por setor, indicador global e simulação vivem como views e
funções no Postgres. A aplicação consulta e desenha.

**Por quê.**

- **Um lugar só para a regra.** A fórmula de cobertura aparece no painel, no relatório, na
  exportação e na comparação entre meses. Se estiver em quatro componentes, um dia serão quatro
  fórmulas ligeiramente diferentes. É literalmente o erro da planilha (`AM3` e `AM4`), reencenado
  em TypeScript.
- **Faz o banco trabalhar no que ele é bom.**
- **Fica inspecionável.** Você abre um cliente SQL e confere o número, sem subir a aplicação.

**Descartado.** Cálculo no app (duplicação); materialized views (otimização prematura nesta
escala, e traz o problema de quando atualizar).

**Custo.** Parte da lógica de negócio sai do TypeScript e perde a tipagem automática. Mitigação:
declarar as views no schema Drizzle como tabelas somente leitura e testar cada fórmula contra um
conjunto de dados conhecido (seção 13).

**Exceção deliberada.** As regras que não são agregação — classificar um número em
vermelho/amarelo/verde, calcular criticidade ponderada — ficam em `lib/dominio/` como funções
puras em TypeScript, porque precisam ser testadas exaustivamente e usadas na renderização.

---

### ADR-009 — Tarefa nunca é deletada; o catálogo tem vigência

**Contexto.** Esta decisão nasceu de uma evidência concreta encontrada na planilha de referência.
As abas históricas têm **84 tarefas**; a aba do mês atual tem **64**. O catálogo encolheu 20
tarefas ao longo do período coberto.

Mesmo que a planilha nunca seja importada, **o fato observado continua valendo**: o catálogo de
tarefas deste departamento muda ao longo do tempo, e muda bastante. Isso é informação sobre o
domínio, não sobre o arquivo.

**Decisão.** `tarefa` tem `ativa_desde` e `ativa_ate`. Nada é removido fisicamente. Um ciclo
enxerga as tarefas vigentes na sua data de referência.

**Por quê.** Se você deletar a tarefa que saiu do catálogo, o ciclo de agosto passa a mostrar uma
cobertura diferente da que foi apresentada na época. O histórico se corrompe em silêncio, que é
precisamente o defeito que o projeto existe para eliminar.

**Descartado.** Delete físico (destrói histórico); flag booleana `ativa` (não diz *desde quando*,
então não dá para reconstruir a foto de um mês passado corretamente).

**Custo.** Toda consulta de catálogo precisa filtrar vigência. Encapsular isso em uma função
`tarefasVigentesEm(data)` e não repetir o filtro espalhado pelo código.

---

### ADR-010 — Multi-departamento desde o primeiro dia

**Contexto.** O primeiro uso cobre um departamento. O objetivo 9 prevê a empresa inteira.

**Decisão.** `departamento_id` presente desde a primeira migration, mesmo com uma linha na tabela.
A interface pode nem expor a escolha no começo.

**Por quê.** É a diferença entre um `WHERE` a mais agora e uma migração de dados com reescrita de
todas as consultas depois. Custo hoje: quinze minutos. Custo depois: dias.

**Descartado.** Adicionar quando precisar (é o tipo de dívida que só se paga com juros).

**Custo.** Quinze minutos e uma coluna que fica inútil por alguns meses.

---

### ADR-011 — On-premise por padrão, portátil por disciplina

**Contexto.** A decisão é rodar tudo na infraestrutura da empresa, sem serviço de nuvem.

**Decisão.** Toda a stack em Docker Compose num servidor interno: Postgres, a aplicação Next.js e
um proxy reverso. Nenhuma dependência de serviço gerenciado.

**Mas a portabilidade continua sendo regra**, por três motivos práticos:

1. Talvez um dia a empresa mude de ideia.
2. Você vai querer rodar isso na sua máquina exatamente como roda no servidor.
3. Dependência escondida de fornecedor é o tipo de coisa que só se descobre no pior momento.

Na prática, três regras:

- **Banco:** só Postgres padrão. Sem extensão exótica. Migrar é `pg_dump` e `pg_restore`.
- **Auth:** tudo isolado em `lib/auth/`. A aplicação pergunta "quem é o usuário e qual o papel",
  não "o que o provider respondeu". Trocar Credentials por LDAP não deve tocar em nenhuma tela.
- **Arquivos:** o sistema não guarda arquivo. Se um dia guardar, passa por uma interface própria,
  nunca por chamadas espalhadas a um SDK.

**Por quê.** O custo de manter essa disciplina é praticamente zero quando se começa assim, e o
custo de não ter é uma reescrita.

**Custo.** Você assume a operação: backup, atualização, certificado, disco. A seção 14 trata
disso. É trabalho real e recorrente, e é o principal preço de não usar nuvem.

---
## 4. Modelo de dados

### 4.1 Diagrama conceitual

```
departamento ──┬── setor ────── tarefa ──────────┐
               │                                 │
               ├── colaborador ──────────────────┤
               │                                 │
               └── ciclo ────────────────────────┤
                                                 │
                                          ┌──────┴──────┐
                                          │    nivel    │  ← o único dado de verdade
                                          └─────────────┘
                                                 │
                                          autoavaliacao   ← fila de entrada do colaborador
```

Tudo o que a ferramenta mostra sai de `nivel`. As outras tabelas existem para dar contexto a ela.

### 4.2 DDL completo

```sql
-- ---------------------------------------------------------------
-- tipos
-- ---------------------------------------------------------------
create type periodicidade  as enum ('diaria','semanal','mensal','anual');
create type status_ciclo   as enum ('aberto','fechado');
create type papel          as enum ('colaborador','gestor','diretoria');
create type origem_nivel   as enum ('importacao','gestor','autoavaliacao_aprovada');
create type status_autoav  as enum ('pendente','aprovada','rejeitada');

-- ---------------------------------------------------------------
-- estrutura organizacional
-- ---------------------------------------------------------------
create table departamento (
  id        bigint generated always as identity primary key,
  nome      text not null unique,
  criado_em timestamptz not null default now()
);

create table setor (
  id              bigint generated always as identity primary key,
  departamento_id bigint not null references departamento on delete restrict,
  nome            text   not null,
  ordem           int    not null default 0,
  unique (departamento_id, nome)
);

create table colaborador (
  id              bigint generated always as identity primary key,
  departamento_id bigint not null references departamento on delete restrict,
  auth_user_id    uuid unique,          -- vínculo com o provedor de identidade
  nome            text not null,
  email           text unique,
  papel           papel not null default 'colaborador',
  entrada_em      date,
  saida_em        date,                 -- quem saiu continua no histórico
  criado_em       timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- catálogo de tarefas
-- ---------------------------------------------------------------
create table tarefa (
  id               bigint generated always as identity primary key,
  setor_id         bigint not null references setor on delete restrict,
  descricao        text   not null,
  periodicidade    periodicidade not null,
  prazo_ancora     text,                       -- 'dia 10', 'dia 20', 'junho'
  peso_criticidade numeric(3,1) not null default 1.0 check (peso_criticidade > 0),
  ordem            int not null default 0,
  ativa_desde      date not null default current_date,
  ativa_ate        date,
  check (ativa_ate is null or ativa_ate >= ativa_desde)
);

create index on tarefa (setor_id) where ativa_ate is null;

-- ---------------------------------------------------------------
-- ciclos e níveis
-- ---------------------------------------------------------------
create table ciclo (
  id              bigint generated always as identity primary key,
  departamento_id bigint not null references departamento on delete restrict,
  referencia      date   not null,      -- sempre o dia 1 do mês
  status          status_ciclo not null default 'aberto',
  fechado_em      timestamptz,
  fechado_por     bigint references colaborador,
  unique (departamento_id, referencia),
  check (referencia = date_trunc('month', referencia)::date),
  check ((status = 'fechado') = (fechado_em is not null))
);

create table nivel (
  ciclo_id       bigint   not null references ciclo on delete cascade,
  tarefa_id      bigint   not null references tarefa on delete restrict,
  colaborador_id bigint   not null references colaborador on delete restrict,
  valor          smallint not null default 0 check (valor between 0 and 4),
  avaliado       boolean  not null default false,
  origem         origem_nivel not null default 'gestor',
  atualizado_por bigint references colaborador,
  atualizado_em  timestamptz not null default now(),
  primary key (ciclo_id, tarefa_id, colaborador_id)
);

create index on nivel (ciclo_id, colaborador_id);
create index on nivel (ciclo_id, tarefa_id);

-- ---------------------------------------------------------------
-- fila de autoavaliação
-- ---------------------------------------------------------------
create table autoavaliacao (
  id             bigint generated always as identity primary key,
  ciclo_id       bigint   not null references ciclo on delete cascade,
  colaborador_id bigint   not null references colaborador on delete cascade,
  tarefa_id      bigint   not null references tarefa on delete cascade,
  valor          smallint not null check (valor between 0 and 4),
  observacao     text,
  status         status_autoav not null default 'pendente',
  decidido_por   bigint references colaborador,
  decidido_em    timestamptz,
  criado_em      timestamptz not null default now(),
  unique (ciclo_id, colaborador_id, tarefa_id)
);
```

### 4.3 Comentários campo a campo sobre o que não é óbvio

**`nivel.avaliado`** — resolve a inconsistência 7. Hoje Luis e Maykon aparecem com zero em
outubro, mas o histórico mostra 164 pontos para Luis em setembro. Zero e "ainda não preenchido"
são coisas semanticamente diferentes que a planilha representa igual. Com esse campo, a interface
consegue dizer *"38 tarefas sem avaliação neste ciclo"* em vez de fingir que a pessoa regrediu.

Isso também protege os indicadores: a simulação de ausência do Luis hoje dá "impacto zero", o que
é falso e está anotado na própria documentação funcional como não confiável.

**A regra 9 da documentação continua valendo.** Colaborador realmente avaliado com zero
permanece na matriz e puxa a média para baixo, porque representa capacidade não instalada. O que
muda é que "não avaliado" para de se disfarçar de zero.

**`nivel` com chave primária composta e sem `id` próprio** — não existe "um nível" como entidade
independente. Existe o nível *daquela pessoa naquela tarefa naquele ciclo*. A chave composta diz
isso e impede duplicata por construção.

**`origem`** — saber se o número veio da importação da planilha, da mão do gestor ou de uma
autoavaliação aprovada importa nos primeiros meses, quando a confiança no dado ainda está sendo
construída. Custo: uma coluna.

**`tarefa.peso_criticidade`** — é a sugestão 5 da documentação funcional ("cruzar semáforo com
prazo legal"). ECD vermelho em junho é mais grave que uma tarefa diária vermelha. O campo entra
agora com default `1.0` e fica dormindo até a fase em que o painel passa a ordenar por
criticidade. Adicionar coluna depois é fácil, mas adicionar já evita uma migration e obriga a
pensar no conceito desde cedo.

**`ciclo.referencia` como `date` e não como texto** — a planilha usa `'Março 2026'` como nome de
aba e isso produz ordenação alfabética, comparação impossível e a necessidade de traduzir mês para
número na mão. Uma data ordena, subtrai e formata sozinha.

**`on delete restrict` quase em toda parte** — o banco deve recusar apagar um setor que tem
tarefas. A exceção é `nivel`, que cai junto com o ciclo (se o ciclo foi apagado, os níveis dele
não têm significado), e `autoavaliacao`, que é fila temporária.

### 4.4 Decisão que eu ainda tenho dúvida

Deixar `nivel` pré-populado com uma linha para toda combinação de tarefa vigente × colaborador
ativo quando o ciclo é criado, ou só inserir quando alguém preenche?

**Inclinação: pré-popular**, com `valor = 0, avaliado = false`. Assim `count(*)` no denominador da
cobertura sai direto da tabela, a grade é um `SELECT` simples e a diferença entre "não avaliado" e
"ausente" nunca aparece. O custo é ~320 linhas por ciclo, o que é nada.

O contra-argumento é que isso cria dado que ninguém pediu e obriga a reconciliar quando uma tarefa
nova é cadastrada no meio do ciclo. Solução: uma função `sincronizar_ciclo(ciclo_id)` que insere
as combinações faltantes, chamada ao criar tarefa. Resolvido, mas é uma peça a mais.

**Reavalie isso ao escrever a tela da matriz.** É o momento em que a resposta fica óbvia.

---

## 5. A camada de cálculo

Todas as fórmulas em um lugar só. Esta seção é a tradução direta das seções 3.4 e 3.5 da
documentação funcional.

### 5.1 Semáforo por tarefa

```sql
create view v_semaforo as
select
  n.ciclo_id,
  n.tarefa_id,
  count(*) filter (where n.valor >= 1)::int as nivel_1,
  count(*) filter (where n.valor >= 2)::int as nivel_2,
  count(*) filter (where n.valor >= 3)::int as nivel_3,
  count(*) filter (where n.valor >= 4)::int as nivel_4,
  count(*) filter (where n.avaliado)::int   as avaliados,
  count(*)::int                             as elegiveis
from nivel n
group by 1, 2;
```

Equivale às colunas AG:AJ. As duas últimas colunas não existem na planilha e servem para a
interface sinalizar cobertura incompleta.

### 5.2 Cobertura por setor e global

```sql
create view v_cobertura_setor as
select
  s.ciclo_id,
  t.setor_id,
  count(*)::int as tarefas,
  sum( least(s.nivel_1,3) + least(s.nivel_2,3)
     + least(s.nivel_3,3) + least(s.nivel_4,3) )::numeric
    / nullif(count(*) * 4 * 3, 0) as cobertura
from v_semaforo s
join tarefa t on t.id = s.tarefa_id
group by 1, 2;
```

Três coisas para reparar:

1. **`count(*) * 4 * 3`** é o denominador: número de tarefas × 4 níveis × meta de 3 pessoas.
   Substitui os divisores `(120*3)`, `(56*3)`, `(20*3)` escritos à mão. Nunca mais vai ficar
   defasado quando uma tarefa entrar ou sair, que é a causa das inconsistências 1, 2 e 3.
2. **`least(x, 3)`** trava o numerador na meta. É a resposta à inconsistência 9 — **e é uma
   decisão de negócio, não técnica.** Ver seção 7.1 antes de assumir como certa.
3. **`nullif(..., 0)`** evita divisão por zero em setor sem tarefa vigente.

A cobertura global é a mesma coisa sem o `group by setor_id`. Mantenha como view separada em vez
de recalcular no app:

```sql
create view v_cobertura_departamento as
select c.id as ciclo_id, c.departamento_id,
       sum( least(s.nivel_1,3) + least(s.nivel_2,3)
          + least(s.nivel_3,3) + least(s.nivel_4,3) )::numeric
         / nullif(count(*) * 4 * 3, 0) as cobertura
from v_semaforo s
join ciclo c on c.id = s.ciclo_id
group by 1, 2;
```

### 5.3 Pontuação do colaborador

```sql
create view v_pontuacao as
select ciclo_id, colaborador_id,
       sum(valor)::int as pontos,
       count(*) filter (where valor >= 3)::int as tarefas_autonomas,
       count(*) filter (where valor  = 4)::int as tarefas_que_ensina
from nivel
where avaliado
group by 1, 2;
```

`pontos` é o total da linha 4 da planilha. As outras duas colunas respondem à advertência da
seção 3.4 da documentação funcional — *"cobertura no nível 1 não é cobertura"* — e são mais
honestas que o ponto agregado. Alexandre com 208 pontos não diz nada; "domina 41 tarefas sozinho e
ensina 28" diz.

### 5.4 Simulação de ausência

O recurso que justifica o projeto. Função, não view, porque recebe parâmetro:

```sql
create function f_semaforo_simulado(p_ciclo bigint, p_ausentes bigint[])
returns table (tarefa_id bigint, nivel_1 int, nivel_2 int, nivel_3 int, nivel_4 int)
language sql stable as $$
  select tarefa_id,
         count(*) filter (where valor >= 1)::int,
         count(*) filter (where valor >= 2)::int,
         count(*) filter (where valor >= 3)::int,
         count(*) filter (where valor >= 4)::int
  from nivel
  where ciclo_id = p_ciclo
    and not (colaborador_id = any(p_ausentes))
  group by tarefa_id;
$$;
```

Um `not in` a mais, e a documentação funcional ganha de graça a tabela da seção 7 que hoje é feita
à mão. Repare que a versão em software é **melhor que a manual**: aceita várias pessoas ao mesmo
tempo, o que responde à pergunta que o gestor realmente tem — *"posso aprovar as férias dos dois
na mesma semana?"* — e que a planilha não responde sem uma hora de trabalho.

### 5.5 Evolução entre ciclos

```sql
create view v_evolucao as
select p.colaborador_id, c.referencia, p.pontos,
       p.pontos - lag(p.pontos) over (
         partition by p.colaborador_id order by c.referencia
       ) as variacao
from v_pontuacao p
join ciclo c on c.id = p.ciclo_id;
```

O `lag()` entrega a **variação**, e a documentação funcional é enfática sobre isso na seção 4.2:
*"a leitura decisiva não é a posição, é a inclinação"*. O Colaborador 4 do exemplo saiu de 45 e
chegou a 131; quem lidera pode estar parado. **A interface deve mostrar a variação com o mesmo
destaque do valor absoluto**, senão o gráfico volta a ser um ranking — exatamente o que a
documentação diz para não fazer.

Vale acrescentar a evolução da própria cobertura do departamento, que é a sugestão 6 da seção 9.2:
hoje o gráfico acompanha pessoas, não cobertura. Com `v_cobertura_departamento` por ciclo, sai de
graça.

### 5.6 O que fica em TypeScript

Só o que não é agregação, em `lib/dominio/`, como funções puras:

```ts
export type Farol = 'vermelho' | 'amarelo' | 'verde';

export function farol(pessoas: number): Farol {
  if (pessoas < 2) return 'vermelho';   // 0 ou 1 — regra do sponsor
  if (pessoas === 2) return 'amarelo';
  return 'verde';
}

export function criticidade(
  semaforo: { nivel_3: number; nivel_4: number },
  peso: number,
): number {
  // o par que importa para risco é nível 3 (opera sozinho) e nível 4 (ensina)
  const base = (3 - Math.min(semaforo.nivel_3, 3))
             + (3 - Math.min(semaforo.nivel_4, 3));
  return base * peso;
}
```

Duas notas:

`farol()` implementa literalmente a frase do sponsor: *"se somente 1 pessoa souber fazer os
trabalhos daquela linha, o semáforo ficará VERMELHO"*. Zero e um são ambos vermelhos — não é
engano, é a regra.

`criticidade()` é proposta minha, não está na documentação funcional. Ela pondera pelos níveis 3 e
4 porque a seção 3.4 identifica esse par como o que realmente mede risco, e multiplica pelo peso
da tarefa para que obrigação com prazo legal suba na lista. **Valide a fórmula com o gestor antes
de exibi-la como número oficial.** Enquanto não validada, use-a apenas para ordenar a lista de
ação, nunca como indicador publicado.

---

## 6. Onde cada regra de negócio vive

Tabela de rastreabilidade. Serve para, quando uma regra mudar, você saber onde mexer — e para
provar que nenhuma regra da documentação funcional ficou órfã.

| Regra (documentação funcional, seção 6) | Onde vive |
|---|---|
| 1. A única marcação válida é `1` | Substituída pelo inteiro 0–4. `CHECK` no banco + controle de 4 segmentos na interface |
| 2. Preenchimento cumulativo da esquerda para a direita | Garantido por construção: um inteiro não tem lacuna |
| 3. Só o gestor altera a matriz | `lib/auth/permissoes.ts`, verificado em toda Server Action de escrita |
| 4. Linhas 3, 4, 5 e colunas AG:AP são fórmulas | Views da seção 5. Não são editáveis porque não são tabelas |
| 5. Semáforo 0 ou 1 = vermelho | `lib/dominio/farol.ts` |
| 6. Meta institucional de 3 pessoas | Constante `META_POR_TAREFA = 3`, usada nas views e no domínio |
| 7. Total é pontuação de nível; variação pesa mais que posição | `v_pontuacao` e `v_evolucao`; e decisão de layout na tela de evolução |
| 8. Cobertura no nível 1 não é cobertura | `v_pontuacao.tarefas_autonomas` e `tarefas_que_ensina`; destaque visual dos níveis 3 e 4 no painel |
| 9. Colaborador com zero permanece e puxa a média | Preservada. O campo `avaliado` só separa zero real de não preenchido |
| 10. Matriz aberta à equipe | Leitura liberada para todos do departamento; escrita restrita |
| 11. Um ciclo por período, o anterior é congelado | `ciclo.status`; escrita bloqueada em ciclo fechado |
| 12. Gráfico recebe nova coluna a cada período | Deixa de ser tarefa manual: `v_evolucao` |
| 13. Consolidação entre departamentos | `departamento_id` em todas as tabelas (ADR-010) |

### Objetivos formais atendidos

| Objetivo | Como o sistema atende | Fase |
|---|---|---|
| 1. Mapear tarefas + cadastrar novas por categoria | CRUD de tarefa com setor obrigatório. Resolve a queixa da seção 9.1: nenhum intervalo de fórmula para corrigir | 1 |
| 2. Cronograma / periodicidade | `enum` com as quatro opções pedidas, `semanal` incluída, e `prazo_ancora` separado | 1 |
| 3. Posicionamento individual | `v_pontuacao` | 2 |
| 4. Grau de conhecimento por tarefa | O nível 0–4 e a leitura horizontal do semáforo | 2 |
| 5. Troca de conhecimento | Matriz visível a todos + tela "quem pode me ensinar" (nível 4 por tarefa) | 2 |
| 6. Desempenho ao longo do período | `v_evolucao`. Deixa de depender do ritual de duplicar aba | 3 |
| 7. Risco de desligamento ou ausência | `f_semaforo_simulado`, com múltiplas pessoas | 2 |
| 8. Base para promoção | Mesma fonte do 6, com variação em destaque | 3 |
| 9. Risco sob a visão da empresa | `v_cobertura_setor` já pronta; consolidação entre departamentos | pós-MVP |

O objetivo 5 merece atenção de produto, não só de código. A frase da documentação é que a matriz
mostra *"a quem pedir ajuda"*. Isso pede uma tela específica: escolho a tarefa, o sistema lista
quem está em nível 4. É barato de fazer e é o recurso que faz o colaborador abrir a ferramenta por
vontade própria, em vez de só quando o gestor pede.

---

## 7. Decisões de negócio a fechar antes de codar

Estas três mudam o schema ou as fórmulas. Não são detalhe de implementação: são perguntas para o
gestor, e é melhor fazê-las agora do que refazer migration depois.

### 7.1 A cobertura pode passar de 100%?

**Situação.** Com 5 pessoas e meta 3, uma tarefa dominada por todas em nível 4 rende 20 pontos
contra um denominador de 12. É a inconsistência 9.

**Opções:**

| Opção | Fórmula | Leitura |
|---|---|---|
| **A — travar em 3** | `least(n, 3)` | "Percentual da meta atingida." Nunca passa de 100%. Excedente não conta |
| **B — meta é todo mundo** | denominador `n_pessoas` em vez de 3 | Meta móvel: muda quando alguém entra ou sai. 100% vira inatingível |
| **C — não travar** | como está hoje | Permite passar de 100%, o que confunde qualquer leitor |

**Minha recomendação: A.** Preserva o número 3, que é a meta institucional declarada e é a mesma
que define o verde do semáforo. Coerência entre indicador e semáforo importa mais que capturar o
excedente. E se o gestor quiser ver o excedente, isso é um segundo indicador ("tarefas acima da
meta"), não uma distorção do primeiro.

**Atenção:** adotar A faz os percentuais mudarem em relação aos que o gestor já apresentou.
Antecipe isso, mostrando o antes e o depois, senão a primeira reação vai ser "o sistema está
errado".

### 7.2 Periodicidade e prazo são a mesma coisa?

**Situação.** A coluna F mistura `Diario`, `Mensal`, `Dia 10`, `Dia 20`, `Junho`, `Julho`. São
dois conceitos: com que frequência a tarefa acontece, e quando vence.

**Recomendação:** dois campos. `periodicidade` como enum fechado (diária, semanal, mensal, anual —
exatamente as quatro que o objetivo 2 pede, incluindo a semanal que hoje falta) e `prazo_ancora`
como texto no MVP.

**Por que `prazo_ancora` fica texto no começo.** Modelar prazo direito significa distinguir "dia
10 de todo mês", "todo junho", "quinto dia útil" e regra de antecipação para dia não útil. É um
mini-domínio de calendário fiscal e não cabe em quatro semanas. Texto livre agora, campo
estruturado quando (e se) alguém pedir alerta de vencimento. **Documente que é dívida consciente**,
para que daqui a seis meses não pareça descuido.

### 7.3 Não avaliado é zero?

**Situação.** Inconsistência 7. Luis com 164 pontos em setembro e zero em outubro não regrediu —
a aba foi duplicada e não preenchida.

**Recomendação:** separar, via `avaliado`. E definir com o gestor o que acontece com o percentual:

- **opção conservadora:** não avaliado conta como zero na cobertura, mas a tela exibe um aviso
  ("42 de 320 células sem avaliação neste ciclo"). Mantém a regra 9 intacta e torna o ruído
  visível.
- **opção alternativa:** não avaliado sai do denominador. Mais "justo" e mais perigoso: a
  cobertura melhora quando o preenchimento piora, que é um incentivo perverso.

**Recomendo a conservadora.** É a que preserva a regra 9 da documentação e a que não cria
incentivo torto.

### 7.4 Ao abrir um ciclo novo, copiar o anterior?

O ritual atual duplica a aba, então o comportamento equivalente é copiar. Mas copiar é
exatamente o que gerou a inconsistência 7.

**Recomendação:** copiar os valores, **mas zerar `avaliado`**. O gestor começa o mês com o
histórico à vista e uma lista explícita do que ainda precisa confirmar. Preserva a conveniência e
elimina o efeito colateral.

---

## 8. Papéis e permissões

Três papéis. Resistir à tentação de inventar mais.

| Ação | colaborador | gestor | diretoria |
|---|---|---|---|
| Ver a matriz do próprio departamento | ✅ | ✅ | ✅ |
| Ver painel de risco e simulador | ✅ | ✅ | ✅ |
| Ver a evolução dos colegas | ✅ | ✅ | ✅ |
| Editar a matriz | ❌ | ✅ | ❌ |
| Enviar a própria autoavaliação | ✅ | ✅ | — |
| Aprovar autoavaliação | ❌ | ✅ | ❌ |
| Cadastrar tarefa, setor, pessoa | ❌ | ✅ | ❌ |
| Abrir e fechar ciclo | ❌ | ✅ | ❌ |
| Ver todos os departamentos | ❌ | ❌ | ✅ |

A transparência ampla nas linhas de leitura não é frouxidão: é o objetivo 5, que é deliberado e
está na regra 10 da documentação. Se em algum momento alguém pedir para esconder a pontuação dos
colegas, isso é uma **mudança de política**, não um ajuste de permissão — vale registrar aqui e
discutir com quem definiu o objetivo.

Implementação: uma função só, usada em toda Server Action de escrita.

```ts
// lib/auth/permissoes.ts
export function podeEditarMatriz(u: Usuario, ciclo: Ciclo) {
  return u.papel === 'gestor'
      && u.departamentoId === ciclo.departamentoId
      && ciclo.status === 'aberto';
}
```

Ciclo fechado é imutável para todo mundo, inclusive para o gestor. Se ele precisar corrigir, tem
que reabrir — e a reabertura fica registrada. É o equivalente honesto de "a aba antiga é
congelada".

---

## 9. As telas

Seis telas no MVP. A primeira é a que decide o sucesso do projeto.

### 9.1 Matriz — `/matriz/[ciclo]`

É a tela mais difícil e a que mais gente erra, porque a tentação é recriar o Excel dentro do
navegador. **Não recrie o Excel.** Você vai perder para o Excel em tudo — atalhos, colar em
bloco, desfazer, familiaridade — e não vai ganhar em nada.

Ganhe onde o Excel não pode jogar: **tornando o estado inválido impossível**.

**O controle de célula.** Cada célula é um grupo de 4 segmentos clicáveis. Clicar no terceiro
define nível 3 e pinta os três primeiros. Clicar de novo no terceiro volta para 2 (ou zera, teste
qual é mais natural). Visualmente é idêntico à planilha; funcionalmente é impossível marcar o
quarto sem os três anteriores.

```
Emissão de NF de venda      │ Luis  ▉▉▉▢ │ Alexandre ▉▉▉▉ │ Pamella ▉▉▉▉ │
Emissão de NF de exportação │ Luis  ▉▢▢▢ │ Alexandre ▉▉▉▉ │ Pamella ▉▉▢▢ │
```

**Requisitos não negociáveis:**

- **Navegação por teclado.** Setas movem, teclas `0`–`4` definem o nível direto. Quem vai
  preencher 320 células com o mouse desiste na terceira vez. Esse detalhe sozinho decide adoção.
- **Salvamento otimista com indicador.** A célula muda na hora, a gravação vai atrás, e um texto
  discreto mostra "salvo às 14:32". Se falhar, desfaz visualmente e avisa. Sem botão "salvar".
- **Semáforo ao vivo na lateral.** O impacto de cada marcação aparece imediatamente. É o que
  transforma o preenchimento de burocracia em feedback.
- **Cabeçalho e coluna de tarefa fixos.** O equivalente ao `freeze panes` da linha 6.
- **Células não avaliadas visualmente distintas** de células avaliadas com zero.
- **Modo leitura** para quem não é gestor, sem controles, com a mesma aparência.

**Técnica:** TanStack Table headless para estrutura e virtualização; o render de célula é seu.
Não use biblioteca de data grid pronta — todas assumem que a célula é um campo de texto, e a sua
não é.

**Agrupamento por setor** com cabeçalho de seção, que substitui as linhas em branco 37, 53, 59,
66, 69 e 75. Como o agrupamento vem de `setor_id`, ele nunca desalinha.

### 9.2 Painel de risco — `/painel/[ciclo]`

A tela do gestor. É onde o projeto se vende sozinho.

1. **Indicador global** com comparação ao ciclo anterior. Não mostre só 59,88%; mostre 59,88% e
   +1,3 pontos.
2. **Cobertura por setor**, ordenada do pior para o melhor. Hoje Obrigações Acessórias com 45,83%
   deveria aparecer no topo, e aparece no meio porque está numa lista posicional.
3. **Semáforo nível a nível**, com destaque para a leitura da seção 3.4: verde no nível 1 com
   vermelho no nível 4 é falsa sensação de segurança. Vale um aviso textual explícito quando esse
   padrão aparecer, porque é exatamente o tipo de coisa que ninguém lê num número.
4. **Plano de ação**: tarefas com semáforo 0 ou 1, ordenadas por criticidade ponderada. É a
   sugestão 3 da seção 9.2 da documentação. Inclua o setor e o prazo, porque ECD em junho e uma
   tarefa diária não são a mesma urgência.
5. **Tarefas sem nenhum especialista** (nível 4 = 0) em bloco próprio. Hoje são três, e é o achado
   mais grave do mês.

### 9.3 Simulador de ausência — `/simulador/[ciclo]`

Multiselect de pessoas, e o painel inteiro recalcula. Mostre lado a lado: situação atual e
simulada, com o delta.

Cenários que valem botão de atalho:
- "e se cada um sair sozinho" — reproduz a tabela da seção 7 da documentação, automaticamente
- "férias de dois ao mesmo tempo" — a pergunta que a planilha não responde

**Deixe explícito quando a simulação não for confiável.** Se a pessoa simulada tem muitas células
não avaliadas, o resultado engana — foi o que aconteceu com Luis e Maykon. Um aviso na tela evita
que alguém tome decisão de férias com base em ruído.

### 9.4 Evolução — `/evolucao`

Linha por colaborador ao longo dos ciclos, mais uma segunda aba com a **evolução da cobertura do
departamento** (sugestão 6 da seção 9.2 — hoje o gráfico acompanha pessoas, não cobertura).

Ao lado do gráfico, a tabela com **variação em destaque**. A documentação funcional é insistente
nisso e por um bom motivo: um gráfico de linhas empilhadas convida a ler ranking, e a leitura
correta é inclinação. Se a coluna de variação estiver em cinza claro no canto, ninguém vai olhar.

### 9.5 Minha autoavaliação — `/minha-avaliacao`

A tela do colaborador. Os passos 1 e 2 do processo de elaboração, que hoje são formulário
individual compilado à mão pelo gestor.

Lista das tarefas do setor da pessoa, cada uma com o mesmo controle de 4 segmentos, mais campo de
observação. Ao enviar, gera linhas em `autoavaliacao` com status pendente. O gestor vê uma fila
com "declarado 3, atual 2 — aprovar / ajustar / rejeitar".

**Isso elimina o passo 3 do processo** ("gestor compila as tarefas em duplicidade"), que é trabalho
puramente mecânico. Mas veja a seção 12: é a primeira coisa que eu cortaria do MVP se o prazo
apertar, porque o gestor consegue viver sem ela e não consegue viver sem a matriz.

### 9.6 Administração — `/admin`

CRUD de setores, tarefas e pessoas, mais o botão de abrir e fechar ciclo.

O cadastro de tarefa é o objetivo 1 da documentação, e vale lembrar o que ele substitui: hoje
incluir uma tarefa exige inserir linha, replicar fórmulas do semáforo e **corrigir manualmente os
intervalos das fórmulas de setor**. No sistema é um formulário com três campos. Mostre esse
contraste na demonstração para o gestor.

**Abrir ciclo** copia os valores do anterior e zera `avaliado` (decisão 7.4). **Fechar ciclo**
pede confirmação, porque torna tudo imutável.

---

## 10. Estrutura do repositório

```
semaforo/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── matriz/[ciclo]/
│   │   ├── page.tsx                 # server component: busca e monta
│   │   ├── grade.tsx                # client component: interação
│   │   ├── celula-nivel.tsx         # o controle de 4 segmentos
│   │   └── actions.ts               # server actions de escrita
│   ├── painel/[ciclo]/page.tsx
│   ├── simulador/[ciclo]/
│   ├── evolucao/page.tsx
│   ├── minha-avaliacao/
│   ├── admin/
│   │   ├── tarefas/
│   │   ├── setores/
│   │   ├── pessoas/
│   │   └── ciclos/
│   └── layout.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts                # tabelas Drizzle
│   │   ├── views.ts                 # views declaradas como somente leitura
│   │   └── consultas/               # uma função por pergunta de negócio
│   │       ├── semaforo.ts
│   │       ├── cobertura.ts
│   │       ├── simulacao.ts
│   │       └── evolucao.ts
│   ├── dominio/                     # funções puras, sem banco, 100% testadas
│   │   ├── farol.ts
│   │   ├── criticidade.ts
│   │   └── constantes.ts            # META_POR_TAREFA = 3, NIVEL_MAX = 4
│   └── auth/
│       ├── sessao.ts
│       └── permissoes.ts
├── drizzle/                         # migrations versionadas
├── scripts/
│   └── importar-xlsx.ts
├── testes/
│   ├── dominio.test.ts
│   └── calculos.test.ts
├── docker/
│   ├── docker-compose.yml           # postgres + app + proxy
│   ├── Dockerfile                   # build standalone do Next
│   └── backup.sh                    # pg_dump agendado
└── .env.example
```

**A pasta `lib/dominio/` merece disciplina.** Ela não importa nada — nem banco, nem React, nem
Next. São funções puras que recebem números e devolvem números. São exatamente as regras que a
planilha errou, e são as mais baratas de blindar com teste. Se uma função dessa pasta precisar
importar alguma coisa, ela está no lugar errado.

**`lib/db/consultas/` tem uma função por pergunta de negócio**, não por tabela. `semaforoDoCiclo()`,
`coberturaPorSetor()`, `tarefasCriticas()`. Assim a linguagem do código é a linguagem do gestor, e
a busca por "onde se calcula cobertura" tem uma resposta só.

---

## 11. A planilha como especificação, não como fonte de dados

A premissa aqui mudou em relação à primeira versão deste documento. O `.xlsx` é **o que o usuário
usa hoje e o norte a ser seguido**, não necessariamente um conjunto de dados a ser migrado. Não há
compromisso de importar coisa alguma.

Isso simplifica bastante o começo do projeto. Mas o arquivo continua sendo a peça mais valiosa
que você tem, por três razões diferentes.

### 11.1 Ela é a especificação mais confiável que existe

Documento de requisitos descreve o que alguém acha que precisa. A planilha mostra **o que a pessoa
realmente faz todo mês há mais de um ano**. Quando as duas coisas discordam, a planilha está
certa.

Use-a para:

- **O catálogo inicial.** As 64 tarefas, os 7 setores e as periodicidades estão listados na seção
  5 da documentação funcional. É o seed do sistema, digitado uma vez.
- **Validar os cálculos.** Os percentuais da seção 7 da documentação são o gabarito — com a
  ressalva importante da seção 11.3 abaixo.
- **Resolver dúvida de regra.** Quando você não souber como algo deve se comportar, olhe o que a
  planilha faz. Ela é a resposta do usuário, já dada.

### 11.2 O que o arquivo revelou sobre o domínio

Abri as abas ocultas e encontrei duas coisas que a documentação funcional não registra e que
continuam valendo mesmo sem importação nenhuma.

**Primeira: o catálogo de tarefas muda, e muito.** As abas históricas têm 84 tarefas; a do mês
atual tem 64. Vinte tarefas saíram ao longo do período. Isso é informação sobre o departamento,
não sobre o arquivo, e é a justificativa empírica do ADR-009. Se o catálogo fosse estável, `ativa_ate`
seria precaução teórica; como ele encolheu 24% em um ano, é necessidade.

**Segunda: a própria ferramenta foi redesenhada no meio do caminho.** As 11 abas históricas usam
um layout em que cada tarefa ocupa 3 linhas e cada colaborador é um quadrado 2×2. A aba do mês
atual usa um layout novo, com 1 linha por tarefa e 4 células em fileira. O gestor mudou o desenho
da ferramenta durante o uso.

Isso é um recado de produto: **ele vai querer mudar o desenho de novo.** O sistema precisa tornar
isso barato, e é por isso que o ADR-008 insiste em calcular em vez de armazenar — quando o cálculo
é derivado, mudar a apresentação não toca no dado.

### 11.3 O gabarito tem erro, e isso é uma oportunidade

Quando você for comparar os seus números com os da planilha, **eles vão divergir em pelo menos
três lugares, e você vai estar certo**:

- `AM4` soma o intervalo de Obrigações Acessórias e mostra o resultado como se fosse de Apuração
  Tributária;
- `AM3` exclui a linha 52, então Recebimento calcula com 14 das suas 15 tarefas;
- `AG5` divide por 280, contando as 6 linhas em branco como se fossem tarefas, o que subestima o
  indicador global.

Isso não é um problema de validação, é a **melhor demonstração de valor disponível no projeto
inteiro**. Assim que você tiver a primeira tela de leitura funcionando, leve a comparação ao
gestor. A conversa deixa de ser "estou construindo um sistema" e vira "a cobertura de Apuração
Tributária que você apresenta não é a real". Veja a seção 12.

Cuidado com a reação, porém: a primeira resposta natural a um número diferente é achar que o
número novo está errado. Mostre o antes, o depois e **a causa**, lado a lado. A causa é o que
convence.

### 11.4 Então importar ou não?

Três opções, em ordem crescente de custo:

**Opção A — só o catálogo, digitado como seed.**
Os 7 setores e as 64 tarefas viram um arquivo `seed.ts` no repositório. Duas horas de digitação,
zero código de importação, e você ganha a chance de já padronizar os textos (a documentação
funcional, inconsistência 10, aponta `Diario` sem acento, `manuntenção`, `Simpificada`).
**É o que eu faria.**

**Opção B — catálogo + os níveis do mês atual, por script.**
Um leitor do layout novo, aplicado a uma aba só. Um dia de trabalho. O ganho não é migrar dados
de produção — é **ter dados realistas para desenvolver**, e poder fazer a comparação da seção 11.3
sem digitar 320 células à mão.

Vale a pena se você quiser a demonstração da seção 11.3 com dados completos, ou se preencher a
matriz inicial à mão parecer tedioso demais.

**Opção C — o histórico inteiro, célula a célula.**
Exige um segundo leitor para o layout 2×2 das abas antigas, e casar por texto as 84 tarefas
antigas com as 64 atuais — sendo que os textos mudaram (`"manuntenção"` virou `"manutenção"`, a
redação foi ajustada). Dois a três dias, boa parte deles chatos e manuais.

**Não faça.** Se um dia alguém pedir para navegar nas matrizes antigas, você faz com o sistema já
rodando e com calma. Até lá, é trabalho sem demanda.

**Meio-termo que custa uma hora:** a aba `Gráfico` já tem a série consolidada de pontos por
colaborador por mês — 6 pessoas × 11 períodos, 66 números, reproduzidos na seção 4.1 da
documentação funcional. Digitados numa tabela `pontuacao_historica (colaborador, referencia,
pontos)`, dão ao gráfico de evolução 14 meses de história sem nenhum importador. Se o gráfico de
evolução importar para você, esse é o melhor custo-benefício do projeto.

### 11.5 Se você optar por escrever um leitor

Anotações para não perder tempo redescobrindo o layout:

```ts
// layout da aba do mês atual: 1 tarefa por linha, linhas 7 a 76
// blocos de 4 colunas por colaborador, a cada 5 colunas a partir de H
const COLABORADORES = [
  { nome: 'Luis',        col: 8  },  // H:K
  { nome: 'Alexandre',   col: 13 },  // M:P
  { nome: 'Pamella',     col: 18 },  // R:U
  { nome: 'Maykon',      col: 23 },  // W:Z
  { nome: 'José Junior', col: 28 },  // AB:AE
];
// coluna B = setor, D = descrição, F = periodicidade
// linhas 37, 53, 59, 66, 69 e 75 são separadores visuais, sem tarefa

function nivelDaLinha(celulas: (number | null)[]): number {
  const n = celulas.filter(v => v === 1).length;
  const contiguo = celulas.slice(0, n).every(v => v === 1)
                && celulas.slice(n).every(v => v == null || v === 0);
  if (!contiguo) throw new Error('marcação não contígua — revisar à mão');
  return n;
}
```

Três cuidados: normalize com `trim()` na leitura (resolve o `"Luis "` com espaço no fim); não
aborte no primeiro erro, acumule e imprima um relatório no final; e torne o script idempotente,
porque você vai rodá-lo umas vinte vezes.

---

## 12. Ordem de construção

Não há prazo, e isso muda o formato desta seção. Ela não é um cronograma com semanas — é uma
**ordem de dependências e marcos de validação**. Faça na velocidade que der.

Sem prazo, o risco muda de natureza. Deixa de ser "não vai ficar pronto a tempo" e vira **"vai
ficar pronto pela metade e parar"** — que é o destino da maioria dos projetos internos sem data.
A defesa contra isso não é pressa, são marcos que produzem alguém interessado. Os três marcos
abaixo existem para isso.

### Etapa 1 — fundação

1. Projeto Next.js criado, Drizzle configurado, Postgres subindo em Docker.
2. **Deploy no servidor funcionando, mesmo com a aplicação vazia.** Faça isso cedo, não no fim.
   Sem nuvem, publicar envolve Docker, proxy reverso, certificado e DNS interno — e cada um desses
   pode consumir uma tarde. Descobrir isso com o sistema pronto é a pior hora.
3. Migration com o schema da seção 4.
4. Seed dos 7 setores e das 64 tarefas (opção A da seção 11.4).
5. As views da seção 5.
6. Uma tela **só de leitura** mostrando o semáforo.

> **Marco 1 — a comparação.** Com dados no sistema (digitados ou importados pela opção B), compare
> seus números com os da planilha e leve a divergência ao gestor. É a prova de valor mais barata
> do projeto inteiro e é o que transforma o projeto de iniciativa pessoal em coisa esperada por
> alguém. Ver seção 11.3.

### Etapa 2 — a matriz

A tela mais difícil e a que decide o sucesso. Reserve atenção inteira para ela.

1. O controle de célula de 4 segmentos, isolado, com teclado funcionando.
2. A grade completa, agrupada por setor, com cabeçalho fixo.
3. Server Actions de escrita, salvamento otimista, permissões.
4. Semáforo ao vivo na lateral.

**Não apresse esta etapa.** Uma matriz ruim mata o projeto, porque é a tela que a pessoa usa todo
mês. Todas as outras ela olha e fecha. Sem prazo, você tem o luxo de refazer o controle de célula
duas vezes até ficar bom — aproveite.

### Etapa 3 — o que faz alguém querer usar

1. Painel de risco com plano de ação ordenado.
2. **Simulador de ausência.**
3. Tela de evolução.
4. CRUD de tarefa, setor e pessoa.

> **Marco 2 — a demonstração.** Mostre ao gestor com dados reais, e **comece pelo simulador, não
> pela matriz.** A matriz é onde o trabalho está; o simulador é onde a decisão de adotar acontece.
> Ver seção 15.

### Etapa 4 — virar o mês de verdade

1. Abrir e fechar ciclo, com a regra de copiar valores e zerar `avaliado`.
2. Login, papéis, usuário de banco com privilégio mínimo.
3. Backup automatizado e testado (seção 14).
4. Testes do domínio e dos cálculos (seção 13).

> **Marco 3 — a virada acompanhada.** Faça a primeira virada de mês junto com o gestor, ao vivo.
> É quando o sistema deixa de ser demonstração e passa a ser ferramenta. Até esse dia, a planilha
> continua sendo a verdade.

### Etapa 5 — autoavaliação

A tela do colaborador e a fila de aprovação. Elimina o passo 3 do processo de elaboração.

Fica por último de propósito: o gestor consegue usar o sistema inteiro sem ela, e ela é a maior
peça isolada de escopo do projeto. Se você a colocasse na etapa 2, ela atrasaria os três marcos.

### O que fica fora por enquanto, conscientemente

| Fica fora | Por quê |
|---|---|
| Importação célula a célula do histórico | Opção C da seção 11.4. Caro e ninguém pediu |
| Multi-departamento na interface | A coluna existe (ADR-010); a tela não precisa existir |
| Exportação PDF e xlsx | Print de tela resolve as primeiras apresentações |
| Criticidade ponderada como número oficial | Use só para ordenar a lista. Validar a fórmula depois |
| LDAP | Comece com Credentials; trocar depois é configuração (ADR-005) |

**Abra um `BACKLOG.md` no primeiro dia** e jogue lá toda ideia boa que aparecer. Sem prazo, a
ameaça não é cortar escopo demais — é nunca fechar etapa nenhuma porque sempre tem algo mais
interessante para fazer. Ideia anotada para de doer.

---

## 13. Testes — o mínimo que não é opcional

Não precisa de cobertura alta. Precisa de cobertura no lugar certo.

**1. `lib/dominio/` — cobertura total.** São funções puras, o teste é trivial e é exatamente onde
a planilha erra:

```ts
test('zero e um são ambos vermelhos', () => {
  expect(farol(0)).toBe('vermelho');
  expect(farol(1)).toBe('vermelho');  // a regra do sponsor
  expect(farol(2)).toBe('amarelo');
  expect(farol(3)).toBe('verde');
});
```

**2. As fórmulas de cálculo, contra um cenário conhecido.** Monte um ciclo de mentira com 3
tarefas e 3 pessoas, com números cujo resultado você calculou na mão, e verifique as views. Se
alguém mexer no `least(n,3)` sem pensar, o teste avisa.

**3. Um teste de regressão sobre o cenário da planilha.** Grave os valores esperados do mês atual
— já corrigidos, isto é, **os certos, e não os que a planilha exibe** — e verifique. É o teste que
garante que um refactor não degradou o cálculo.

**4. O restore do backup.** Sem nuvem, isso é teste, não administração. Ver seção 14.

Não escreva teste de interface por enquanto. Custa caro, quebra a cada mudança de layout, e a
matriz vai mudar de layout várias vezes.

---

## 14. Operação sem nuvem

Esta é a seção que mais mudou com a decisão de não usar serviços gerenciados. Aqui você é o
sysadmin, e vale tratar isso como parte do projeto e não como um detalhe do fim.

### 14.1 Topologia

Três contêineres num servidor Linux da empresa:

```
┌─────────────────────────────────────────────┐
│ servidor interno                            │
│                                             │
│  ┌──────────┐   ┌──────────┐   ┌─────────┐  │
│  │  Caddy   │──▶│   app    │──▶│ postgres│  │
│  │  :443    │   │  :3000   │   │  :5432  │  │
│  └──────────┘   └──────────┘   └─────────┘  │
│       ▲              rede interna do compose│
└───────┼─────────────────────────────────────┘
        │
   rede da empresa
```

Só o Caddy publica porta. **O Postgres não expõe porta nenhuma para o host** — só a aplicação o
alcança, pela rede interna do Compose. Isso é metade da segurança do sistema, e é de graça.

Caddy em vez de Nginx pela simplicidade: ele resolve certificado sozinho e o arquivo de
configuração tem cinco linhas. Nginx serve igualmente bem se você já tem familiaridade.

### 14.2 Esqueleto do Compose

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: semaforo
      POSTGRES_USER: semaforo_app
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped
    # sem "ports": o banco não é alcançável de fora
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U semaforo_app"]
      interval: 10s

  app:
    build: .
    environment:
      DATABASE_URL: postgres://semaforo_app@postgres:5432/semaforo
      AUTH_SECRET_FILE: /run/secrets/auth_secret
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  caddy:
    image: caddy:2
    ports: ["443:443", "80:80"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddydata:/data
    restart: unless-stopped

volumes:
  pgdata:
  caddydata:
```

Para o build da aplicação, use `output: 'standalone'` no `next.config.js`. Ele gera uma imagem
pequena e sem `node_modules` completo, e é o modo pensado justamente para auto-hospedagem.

### 14.3 Ambientes

| Ambiente | Onde | Para quê |
|---|---|---|
| Local | O mesmo Compose, na sua máquina | Desenvolvimento |
| Produção | Servidor da empresa | O que o gestor usa |

Sem nuvem, some o ambiente de preview por branch. **Compense com dados de desenvolvimento
realistas**, senão você vai testar em produção sem perceber. Um `seed-dev.ts` que popula um ciclo
completo com valores plausíveis resolve.

### 14.4 Backup — a parte que não dá para adiar

Na nuvem, backup é uma caixa marcada no painel. Aqui não é, e **os dados deste sistema não são
recuperáveis por redigitação**: são anos de avaliação de competência acumulada.

O mínimo aceitável:

```bash
#!/usr/bin/env bash
# docker/backup.sh — agendar no cron, diariamente
set -euo pipefail
DATA=$(date +%F)
DESTINO=/mnt/backup/semaforo          # share de rede, NÃO o mesmo disco
docker compose exec -T postgres \
  pg_dump -U semaforo_app -Fc semaforo \
  > "$DESTINO/semaforo-$DATA.dump"
find "$DESTINO" -name 'semaforo-*.dump' -mtime +90 -delete
```

Três regras que valem mais que o script:

1. **O destino não pode ser o mesmo disco nem a mesma máquina.** Backup que mora junto com o dado
   não é backup.
2. **Teste o restore.** Uma vez por trimestre, restaure um dump num banco descartável e abra o
   sistema apontando para ele. Backup nunca testado tem alta probabilidade de não funcionar
   exatamente quando precisar.
3. **Antes de cada migration em produção, um dump manual.** É o botão de desfazer.

### 14.5 Atualização e disco

- **Publicar versão nova:** `git pull`, `docker compose build app`, rodar as migrations, `docker
  compose up -d app`. Vale escrever isso num `deploy.sh` de cinco linhas — não para automatizar,
  mas para não esquecer a ordem às onze da noite.
- **Migrations em produção** rodam com um usuário de banco separado, com mais privilégio, usado só
  nesse momento (ADR-006).
- **Disco:** o volume do Postgres cresce muito devagar aqui, mas logs de contêiner não. Configure
  rotação no Docker, senão daqui a um ano o servidor enche por causa de log.

### 14.6 Custo

Zero em licença e assinatura. O custo é o servidor, que provavelmente já existe, e **o seu tempo
de operação** — que é real e recorrente, e é a principal coisa que você está trocando pela
independência de nuvem. Vale entrar com essa expectativa em vez de descobrir depois.

---

## 15. Riscos do projeto

Por ordem do que mais provavelmente vai dar errado.

| Risco | Probabilidade | Impacto | O que fazer |
|---|---|---|---|
| **Projeto parar no meio** | **Alta** | **Total** | Sem prazo, é o risco número um. Os três marcos da seção 12 existem para criar alguém esperando |
| **Ninguém usar depois de pronto** | Média | Total | Ver abaixo |
| **A matriz ficar ruim de usar** | Média | Alto | Etapa inteira dedicada; teclado como requisito, não como luxo |
| **Gestor desconfiar dos números diferentes** | Alta | Médio | Antecipe no marco 1, com antes, depois e a causa lado a lado |
| **Operação mal feita (backup, disco, certificado)** | Média | Alto | Seção 14. Automatize o backup antes de precisar dele |
| **Crescimento de escopo** | Alta | Médio | `BACKLOG.md` desde o dia 1 |

Os dois primeiros merecem parágrafo próprio.

**Projeto parar no meio.** Sem data, nada força o fechamento de uma etapa, e sempre há algo mais
interessante para começar do que terminar. O antídoto que funciona não é disciplina — é
**compromisso externo**. Cada marco da seção 12 coloca o projeto na frente do gestor. Depois do
marco 1, existe alguém perguntando como está. Depois do marco 3, existe alguém dependendo.
Marque-os na agenda mesmo sem prazo para o projeto inteiro.

**Ninguém usar depois de pronto.** A planilha **já está funcionando**, e existe um custo de troca
real para quem a usa. Para vencer isso, o sistema precisa de pelo menos um recurso que o gestor
não consiga viver sem depois de provar. Meu candidato é o **simulador de ausência**: é uma
pergunta que ele já tem, que a planilha responde mal, e cuja resposta ele vai querer toda vez que
alguém pedir férias.

Priorize esse recurso na demonstração, não a matriz. A matriz é onde o trabalho está; o simulador
é onde a decisão de adotar acontece.

---

## 16. Backlog

Em ordem aproximada de valor por esforço:

1. **Tela "quem pode me ensinar isso"** — escolho a tarefa, vejo quem está em nível 4. É o
   objetivo 5 materializado, é barato, e é o recurso que faz o colaborador abrir a ferramenta por
   vontade própria.
2. **Exportação em PDF e xlsx** do painel, para apresentação.
3. **Responsável principal e backup por tarefa** (sugestão 4 da seção 9.2 da documentação
   funcional): torna explícito o plano de contingência que hoje só se lê indiretamente.
4. **Criticidade ponderada** validada com o gestor e publicada como indicador.
5. **Consolidação entre departamentos** (objetivo 9). A coluna já existe; falta a tela e o segundo
   departamento real.
6. **Alertas**: tarefa que entrou em vermelho desde o ciclo anterior, colaborador sem evolução há
   N ciclos. Sem nuvem, e-mail depende de um SMTP interno — verifique se existe antes de prometer.
7. **LDAP** no lugar de Credentials, se houver AD local (ADR-005).
8. **Importação do histórico célula a célula** (opção C da seção 11.4).
9. **Prazo estruturado** em vez de texto livre, com calendário fiscal e dia útil.
10. **Trilha de auditoria** (`nivel_historico`), se alguém perguntar "quando exatamente isso
    mudou".

---

## 17. Mapa de tradução — planilha para sistema

Cola rápida para consultar durante a implementação.

| Planilha | Sistema |
|---|---|
| Aba do mês | `ciclo` com `referencia` no dia 1 do mês |
| Duplicar aba e ocultar a anterior | `ciclo.status = 'fechado'` + abrir o próximo |
| Coluna B `Setorização` | `tarefa.setor_id` |
| Coluna D `Tarefas` | `tarefa.descricao` |
| Coluna F `Periodicidade` | `tarefa.periodicidade` + `tarefa.prazo_ancora` |
| H:K, M:P, R:U… (4 colunas por pessoa) | `nivel.valor`, inteiro de 0 a 4 |
| Linha 3 — soma por nível | `v_pontuacao` |
| Linha 4 — total do colaborador | `v_pontuacao.pontos` |
| AG:AJ — semáforo | `v_semaforo` |
| Formatação condicional vermelho/amarelo/verde | `lib/dominio/farol.ts` |
| AG5 — indicador global | `v_cobertura_departamento` |
| AL:AM e AO:AP — cobertura por setor | `v_cobertura_setor` |
| Aba `Gráfico` | `v_evolucao` |
| Colunas A, C, E, G… (separadores) | Não existem. Eram artefato de layout |
| Linhas 37, 53, 59… (separadores de setor) | Não existem. Agrupamento vem de `setor_id` |
| Zerar a coluna de alguém na mão | `f_semaforo_simulado(ciclo, [pessoa])` |
| Proteger fórmulas contra edição | Não é necessário: view não é editável |

---

## 18. Por onde começar

```bash
npx create-next-app@latest semaforo --typescript --tailwind --app
cd semaforo
npm i drizzle-orm postgres
npm i -D drizzle-kit
```

Postgres local, sem instalar nada na máquina:

```bash
docker run -d --name semaforo-db \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=semaforo \
  -p 5432:5432 \
  -v semaforo-pgdata:/var/lib/postgresql/data \
  postgres:17
```

Depois, nesta ordem:

1. `lib/db/schema.ts` com o DDL da seção 4.
2. Primeira migration, e o seed dos 7 setores e 64 tarefas.
3. As views da seção 5, como migration SQL.
4. A tela de leitura do semáforo.
5. A comparação com a planilha, levada ao gestor (marco 1).

Depois do passo 5 o projeto passa a ter alguém esperando por ele — e, num projeto sem prazo, isso
vale mais que qualquer decisão de arquitetura deste documento.

Deixe o Docker Compose completo da seção 14 para quando a etapa 1 estiver funcionando na sua
máquina. Mas não deixe para o fim: publicar pela primeira vez leva uma tarde, e você quer que
essa tarde aconteça cedo.

---

## Apêndice — perguntas que ainda não têm resposta

Anotadas para não se perderem. Nenhuma bloqueia o começo.

1. **Pré-popular `nivel` ao abrir o ciclo, ou inserir sob demanda?** (seção 4.4 — decida ao
   escrever a matriz, é quando a resposta fica óbvia)
2. **A meta de 3 muda se o departamento tiver 3 pessoas?** Com 3 pessoas, 100% exige que todos
   dominem tudo em nível 4, o que é irreal. Talvez a meta devesse ser `min(3, n_pessoas - 1)` —
   mas isso torna o indicador incomparável entre departamentos de tamanhos diferentes, o que
   atrapalha o objetivo 9. Não tenho resposta boa; pergunte ao gestor.
3. **Tarefa pode pertencer a mais de um setor?** Hoje não, mas "Análise de impostos e tributações
   das operações em geral" parece transversal.
4. **O que acontece com a pontuação de quem entra no meio do ciclo?**
5. **A diretoria vê nome de pessoa ou só o agregado por setor?** Muda a tela e tem implicação de
   privacidade.
6. **Existe AD local na empresa?** Decide o ADR-005 e vale perguntar cedo, porque muda o trabalho
   de login.
7. **Existe servidor interno disponível, e quem o administra?** Se for você, a seção 14 é
   trabalho seu. Se for a TI, converse com eles antes da etapa 1, não depois.
8. **Como registrar que alguém foi treinado em uma tarefa**, e não só que o nível mudou? Seria a
   base de um plano de desenvolvimento individual — e provavelmente é o próximo produto, não este.
