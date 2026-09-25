# Semáforo de Polivalência — Documentação Funcional

**Arquivo:** `Semáforo de Polivalência - v2.xlsx`
**Tipo:** Matriz de polivalência / competências (skill matrix) com indicador de risco operacional
**Área:** Departamento Fiscal / Faturamento / Financeiro

---

## 1. O que é e para que serve

A planilha mapeia **todas as tarefas do departamento** e registra, para **cada colaborador**, o
**grau de domínio** em cada uma delas. A partir desse cruzamento, calcula automaticamente:

- quantas tarefas cada colaborador domina e em que nível;
- **quantas pessoas sabem executar cada tarefa** — o indicador chamado **Semáforo**;
- o **percentual de cobertura** do departamento como um todo e de cada setor;
- a **evolução dos colaboradores ao longo dos meses**, em gráfico.

O objetivo central é **expor risco de dependência**: tarefas que dependem de uma única pessoa
ficam visualmente marcadas em vermelho, permitindo ao gestor agir antes de uma férias,
afastamento ou desligamento paralisar a operação.

### Objetivos formais e como cada um se materializa

Os nove objetivos estão declarados na aba `Objetivos e Elaboração`. A coluna da direita traz o
detalhamento dado pelo gestor do projeto sobre **como** cada objetivo é (ou deve ser) atendido.

| # | Objetivo | Como se materializa na ferramenta |
|---|---|---|
| **1** | Mapeamento de todas as tarefas do departamento | Saber quais serviços pertencem ao departamento. Deve existir uma opção para **cadastrar novos serviços dentro das categorias** da primeira coluna (`Setorização`). |
| **2** | Geração de cronograma de entrega das obrigações/tarefas | Cada tarefa precisa de um espaço para **prazo de entrega ou periodicidade** — diário, semanal, mensal, anual. É a coluna `Periodicidade` (F). |
| **3** | Posicionamento do colaborador / avaliação individual | Quadro com a **soma dos pontos do colaborador**, exibida na **linha 4** — a soma dos `1` informados nos quadros. |
| **4** | Identificação do grau de conhecimento em tarefas específicas | A variação entre preencher **1 campo ou 4 campos** define o grau. Regra de leitura do gestor: *"se eu tiver 3 colaboradores no nível 1, não me adianta muito — tenho 3 aprendizes e nenhum especialista."* |
| **5** | Motivação para troca de conhecimentos | Os colaboradores **veem os quadros uns dos outros**. Isso gera incentivo para alcançar o score do colega e, principalmente, mostra **a quem pedir ajuda** para aprender uma tarefa. |
| **6** | Gerador de desempenho ao longo do período | O gestor **congela a planilha a cada mês e copia para o mês seguinte**, comparando o que o colaborador sabia com o que ele aprendeu ao preencher a planilha nova. |
| **7** | Identificação de risco em caso de desligamento ou ausência | Ao cogitar um desligamento, o gestor **simula a ausência dos pontos daquele colaborador** e vê em qual ponto crítico o departamento ficaria. |
| **8** | Base para adequação / promoção / desligamento | A avaliação se apoia no desempenho medido no item 6, de modo que **o gestor não tire conclusões próprias** para conceder ou negar uma promoção. |
| **9** | Indicador de riscos sob a visão **da empresa** | As colunas **AL até AP** permitem a análise **por setor**, identificando os quadros mais críticos. No exame atual, *Obrigações Acessórias* é o mais crítico e *Recebimento* o mais confortável. |

> **Princípio que atravessa os nove itens:** a planilha existe para substituir a percepção
> subjetiva do gestor por evidência mensurável — tanto na avaliação de pessoas (itens 3, 6, 8)
> quanto na gestão de risco (itens 7, 9).

### Processo de elaboração (declarado na mesma aba)

1. Colaborador informa as tarefas que executa, em formulário individual.
2. Colaborador informa o nível de conhecimento das tarefas que executa, em formulário individual.
3. Gestor compila as tarefas em duplicidade.
4. Gestor efetua a revisão das informações.
5. **A ferramenta aplica as análises.**
6. Gestor decide qual o destinatário das informações.
7. Gestor decide sobre as tomadas de decisão necessárias.
8. Compilação dos dados e consolidação dos relatórios de todos os departamentos, para gestão de
   risco por parte da empresa como um todo.

> Ou seja: **o preenchimento é declaratório (autoavaliação) e validado pelo gestor**; a planilha
> só entra depois, como motor de cálculo e de visualização.

---

## 2. Estrutura do arquivo

| Aba | Situação | Função |
|---|---|---|
| **Objetivos e Elaboração** | Visível | Objetivos, processo de elaboração e **legenda oficial dos 4 níveis de domínio** |
| **Agosto 2025** … **Setembro 2026** (11 abas) | **Ocultas** | Histórico. Serve de fonte para a aba `Gráfico` |
| **Gráfico** | Visível | Evolução do total de pontos por colaborador ao longo dos meses |
| **Outubro 2026** | Visível | **Aba operacional do mês corrente** |

Periodicidade das fotografias: bimestral até `Fevereiro 2026` (Ago/25, Out/25, Dez/25, Fev/26) e
**mensal** a partir de `Março 2026`.

> **Padrão de virada de mês:** duplica-se a aba do mês anterior, renomeia-se com o novo mês e a
> aba antiga é ocultada. O histórico nunca é sobrescrito.

---

## 3. Anatomia da aba mensal (`Outubro 2026`)

Painel congelado nas linhas 1–5 (`freeze panes` em A6), linhas de grade desativadas.

```
 B            D                          F              H..AE                      AG:AJ      AL:AM / AO:AP
┌───────────┬──────────────────────────┬──────────────┬──────────────────────────┬──────────┬──────────────────┐
│Setorização│ Tarefas                  │ Periodicidade│ 5 colaboradores × 4 col. │ Semáforo │ Painel de % por  │
│           │                          │              │                          │          │ setor            │
└───────────┴──────────────────────────┴──────────────┴──────────────────────────┴──────────┴──────────────────┘
```

As colunas **A, C, E, G, L, Q, V, AA, AF, AK, AN** têm largura mínima e funcionam apenas como
separadores visuais entre os blocos.

### 3.1 Identificação da tarefa

| Coluna | Cabeçalho | Conteúdo |
|---|---|---|
| **B** | `Setorização` | Setor responsável. 7 valores: `Faturamento`, `Recebimento`, `Apuraç. Tribut.`, `Obrigaç.Acess.`, `Fiscal`, `Sist.Domínio`, `Financeiro` |
| **D** | `Tarefas` (sob o título `Classificação do Colaborador`) | Descrição da atividade — 64 tarefas ativas |
| **F** | `Periodicidade` | Quando a tarefa é executada: `Diario` (43), `Mensal` (16), `Dia 10` (2), `Dia 20` (1), `Junho` (1), `Julho` (2) |

As tarefas ocupam as **linhas 7 a 76**, com linhas em branco (37, 53, 59, 66, 69, 75) separando
os blocos de setor.

### 3.2 Bloco de colaboradores

Cada colaborador ocupa **4 colunas contíguas** sob um cabeçalho mesclado com o seu nome:

| Colaborador | Colunas | Total no mês (linha 4) |
|---|---|---|
| Luis | **H:K** | 0 |
| Alexandre | **M:P** | 208 |
| Pamella | **R:U** | 222 |
| Maykon | **W:Z** | 0 |
| José Junior | **AB:AE** | 73 |

Fórmulas de totalização:

- **Linha 3** — total por nível: `=SUM(H7:H76)`, `=SUM(I7:I76)`, `=SUM(J7:J76)`, `=SUM(K7:K76)`
- **Linha 4** — total geral do colaborador: `=SUM(H7:K76)`

### 3.3 Escala de domínio — o significado das 4 colunas

Este é o coração da ferramenta. As 4 colunas de cada colaborador representam uma **escala
cumulativa de 4 níveis**, preenchida **da esquerda para a direita** com o valor `1`:

| Nível | Colunas marcadas | Rótulo oficial | Leitura |
|---|---|---|---|
| **1** | ▉▢▢▢ | **Aprendendo** | Está em treinamento na tarefa |
| **2** | ▉▉▢▢ | **Consegue fazer com ajuda** | Executa sob supervisão |
| **3** | ▉▉▉▢ | **Consegue fazer sem ajuda** — *"Sei fazer, mas não sei porque faço"* | Autônomo na execução, sem domínio conceitual |
| **4** | ▉▉▉▉ | **Consegue fazer e ensinar** — *"Sei fazer, e sei porque faço"* | Domínio pleno; pode treinar outra pessoa |

Na aba `Objetivos e Elaboração` a legenda é desenhada como um quadrado 2×2 preenchido por
quadrantes; na aba mensal o mesmo conceito aparece como 4 células em linha.

**Consequência prática:** o total de um colaborador **não é o número de tarefas que ele sabe
fazer**, e sim a **soma dos pontos de nível**. Uma tarefa em nível 4 vale 4; em nível 2 vale 2.
Alexandre, com 208 pontos, está em algum ponto entre "52 tarefas em nível 4" e "todas as 64 em
nível ~3".

**Formatação:** célula com valor `> 0` recebe preenchimento cinza escuro (`#7F7F7F`) por
formatação condicional, produzindo o efeito de barra preenchida.

### 3.4 Bloco **Semáforo** (colunas AG:AJ)

Para cada tarefa e cada nível, soma quantos colaboradores atingiram aquele nível:

```
AG7 = H7 + M7 + R7 + W7 + AB7     (nível 1)
AH7 = I7 + N7 + S7 + X7 + AC7     (nível 2)
AI7 = J7 + O7 + T7 + Y7 + AD7     (nível 3)
AJ7 = K7 + P7 + U7 + Z7 + AE7     (nível 4)
```

O resultado varia de `0` a `5` (número de colaboradores na matriz).

#### Regra de cor — a regra central de negócio

| Valor | Cor | Significado | Ação esperada |
|---|---|---|---|
| **0** | 🔴 **Vermelho** | Ninguém executa a tarefa naquele nível | Risco crítico — alocar e treinar imediatamente |
| **1** | 🔴 **Vermelho** | **Apenas uma pessoa sabe fazer** | Ponto único de falha — formar backup |
| **2** | 🟡 **Amarelo** | Duas pessoas cobrem a tarefa | Backup mínimo; atenção |
| **≥ 3** | 🟢 **Verde** | Três ou mais pessoas cobrem a tarefa | Situação adequada |

> Regra confirmada pelo sponsor: **"Se somente 1 pessoa souber fazer os trabalhos daquela linha,
> o semáforo ficará VERMELHO."**

Implementação real (formatação condicional sobre `AG7:AJ76`, por ordem de prioridade):
`< 2` → vermelho · `= 2` → amarelo · `> 2` → verde.

#### Ler as quatro colunas do semáforo, não apenas a primeira

Como cada uma das 4 colunas corresponde a um nível, o semáforo deve ser lido na horizontal:

| Coluna | Responde à pergunta |
|---|---|
| **AG** (nível 1) | Quantas pessoas **têm algum contato** com a tarefa? |
| **AH** (nível 2) | Quantas conseguem executar **com ajuda**? |
| **AI** (nível 3) | Quantas executam **sozinhas**? — é a cobertura operacional real |
| **AJ** (nível 4) | Quantas **dominam e podem ensinar**? — é a capacidade de formar sucessores |

Regra de interpretação dada pelo gestor: *"se eu tiver 3 colaboradores no nível 1, não me adianta
muito, porque tenho 3 aprendizes e nenhum especialista."*

Na prática: **`AG` verde com `AJ` vermelho é uma falsa sensação de segurança.** A tarefa parece
coberta, mas ninguém ali é capaz de treinar um substituto — a equipe não consegue se reproduzir.
O par de colunas que mais importa para risco é `AI` (quem opera sem apoio) e `AJ` (quem ensina).

#### Indicador global (célula AG5)

```
=SUM(AG7:AJ76) / (280 * 3)
```

Lê-se: **pontos obtidos ÷ pontos-meta**, onde a meta é **3 colaboradores em cada uma das 4
posições de cada tarefa** — ou seja, a planilha assume como objetivo institucional que
**toda tarefa seja dominada por pelo menos 3 pessoas**. É o mesmo número 3 que define o verde do
semáforo. Valor atual: **59,88%**.

### 3.5 Painel de cobertura por setor (AL:AM e AO:AP)

| Setor | Fórmula | Linhas | % atual |
|---|---|---|---|
| Faturamento | `=SUM(AG7:AJ36)/(120*3)` | 7–36 | **62,22%** |
| Recebimento | `=SUM(AG38:AJ51)/(56*3)` | 38–52 | **82,74%** |
| Apuraç. Tribut. | `=SUM(AG60:AJ65)/(20*3)` | 54–58 | **55,00%** |
| Obrigaç. Acess. | `=SUM(AG60:AJ65)/(24*3)` | 60–65 | **45,83%** |
| Fiscal | `=SUM(AG67:AJ68)/(8*3)` | 67–68 | **66,67%** |
| Sist. Domínio | `=SUM(AG70:AJ74)/(20*3)` | 70–74 | **50,00%** |
| Financeiro | `=SUM(AG76:AJ76)/(4*3)` | 76 | **58,33%** |

Formato de número `0,00%` em todos os indicadores.

---

## 4. Acompanhamento da evolução do colaborador

### 4.1 Aba `Gráfico`

Consolida o **total de pontos de cada colaborador mês a mês**, buscando o valor diretamente nas
abas históricas (ex.: `='Março 2026'!K8`). Alimenta o gráfico de linhas
**"Gráfico de Evolução de atividades polivalentes por colaborador"**.

Série histórica registrada (Ago/25 → Set/26):

| Colaborador | Ago/25 | Out/25 | Dez/25 | Fev/26 | Mar/26 | Abr/26 | Mai/26 | Jun/26 | Jul/26 | Ago/26 | Set/26 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Alexandre | 121 | 175 | 175 | 175 | 175 | 199 | 199 | 199 | 199 | 210 | 210 |
| Pamella | 54 | 54 | 54 | 169 | 169 | 191 | 191 | 191 | 219 | 219 | 219 |
| Kevin | 0 | 0 | 0 | 0 | 0 | 0 | 12 | 37 | 62 | 69 | 69 |
| Luis | 120 | 144 | 144 | 144 | 164 | 164 | 164 | 164 | 164 | 164 | 164 |
| Maykon | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Loraine | 54 | 0 | 0 | 53 | 0 | 0 | 0 | 0 | — | — | — |

> A curva ascendente de Kevin (0 → 69) é o retrato de um processo de onboarding; os platôs de
> Alexandre e Pamella mostram períodos sem evolução de polivalência.

### 4.2 Exemplo de análise de desempenho do colaborador

Na aba `Objetivos e Elaboração` (intervalo **AM3:AQ7**) existe um quadro-exemplo que demonstra
como ler a evolução. Ele atende diretamente aos objetivos **3, 5, 6 e 8** — os marcadores numéricos
impressos sobre o quadro indicam exatamente isso.

| Colaborador | 1º Trim | 2º Trim | 3º Trim | Variação |
|---|---|---|---|---|
| Colaborador 3 | **138** | 140 | 142 | +4 |
| Colaborador 2 | 126 | **146** | **158** | +32 |
| Colaborador 1 | 99 | 129 | 131 | +32 |
| Colaborador 4 | 45 | 95 | 131 | **+86** |

**Como o gestor lê este quadro:**

- O **Colaborador 3** tinha o melhor desempenho no 1º trimestre, mas praticamente estagnou
  (+4 pontos em dois trimestres).
- O **Colaborador 2** o ultrapassou já no 2º trimestre e seguiu avançando no 3º, assumindo a
  liderança.
- O **Colaborador 4** partiu muito atrás (45 pontos), mas **alcançou o Colaborador 1** ao longo do
  período: *"ele correu pra aprender e ser melhor."*

> **A leitura decisiva não é a posição, é a inclinação.** Quem lidera o ranking pode estar parado,
> e quem está no fim pode ser o que mais aprendeu. É essa distinção que torna a ferramenta uma
> base legítima para promoção (objetivo 8) — a conversa deixa de ser "quem eu acho que é melhor"
> e passa a ser "quem evoluiu, e quanto".

O quadro é intencionalmente genérico (`Colaborador 1` a `Colaborador 4`) por servir de **modelo de
leitura**, não de registro real. A tabela de dados reais equivalente está na aba `Gráfico`
(seção 4.1), que hoje trabalha em base mensal.

---

## 5. Catálogo de tarefas

### 5.1 Faturamento — 30 tarefas (linhas 7–36) — periodicidade `Diario`

**Emissão de documentos fiscais**
1. Emissão de NF de venda (NF-e)
2. Emissão de NF de exportação (NF-e)
3. Emissão de NF de importação (NF-e)
4. Emissão de NF de comodato (NF-e)
5. Emissão de NF de bonificação ou brinde (NF-e)
6. Emissão de NF de demonstração (NF-e)
7. Emissão de NF de troca em garantia (NF-e)
8. Emissão de NF de industrialização (NF-e)
9. Emissão de NF de serviço (NFS-e)
10. Emissão de NF de débito (ND)
11. Emissão de NF complementar de ICMS (NF-e)

**Retornos e devoluções**

12. Emissão e/ou lançamento de NF de devolução de venda
13. Emissão e/ou lançamento de NF de retorno de comodato
14. Emissão e/ou lançamento de NF de retorno de demonstração
15. Emissão e/ou lançamento de NF de retorno de industrialização
16. Emissão e/ou lançamento de NF de troca em garantia

**Cadastros, cobrança, contratos e suporte**

17. Análise e/ou criação de cadastros de clientes e fornecedores no sistema SAP
18. Análise de possível emissão de guia DIFAL (diferencial de alíquotas)
19. Confirmação de pagamento dos pedidos de venda com acesso ao banco Itaú
20. Emissão de fatura de adiantamento no pedido de venda
21. Controle das mensalidades de locação na planilha Excel junto com o sistema SAP
22. Envio manual via e-mail das notas de débito e boletos para os respectivos clientes
23. Análise e controle das mensalidades de manutenção de equipamentos, para posterior emissão de NFS-e
24. Análise de novos contratos de locação / planilhamento / cadastro no SAP / emissão das notas de débito (ND)
25. Análise de contratos de locação em andamento
26. Análise de possíveis reajustes contratuais nas parcelas dos contratos de locação/manutenção
27. Controle de retorno de comodato da Geneslab / emissão de NF de venda
28. Suporte e orientações aos setores (help desk, comercial, adequação, almoxarifado)
29. Resolução de problemas e/ou dúvidas de clientes via e-mail, telefone e WhatsApp
30. Análise de impostos e tributações das operações em geral

### 5.2 Recebimento — 15 tarefas (linhas 38–52)

| Tarefa | Periodicidade |
|---|---|
| Lançamento de notas com pedido de compra | Diário |
| Lançamento de notas recorrentes | Diário |
| Lançamentos de guias e impostos (LCM) | Diário |
| Lançamento da folha de pagamento | Mensal |
| Controle de notas de entrada | Diário |
| Lançamento de fatura de cartão de crédito | Mensal |
| Abertura de pedidos recorrentes | Diário |
| Fatura de adiantamento para fornecedor | Diário |
| Importar arquivos XML de saídas para o Arquivei | Diário |
| Envio de documentos à contabilidade externa | Mensal |
| Efetivar lançamentos de impostos em débito automático | Mensal |
| Lançamento de CT-e | Diário |
| Lançamento de multas de trânsito | Diário |
| Lançamentos de Importação Simplificada (Courrier) | Diário |
| Emissão de nota fiscal de Importação Simplificada (Courrier) | Diário |

### 5.3 Apuração Tributária — 5 tarefas (linhas 54–58) — todas `Mensal`

- Conferência das notas fiscais de serviços e cálculo do ISS
- Emissão da Guia de ISS
- Cálculo do PIS e COFINS
- Emissão de DARF através do SicalcWeb
- Cálculo do ICMS com base nos relatórios do SAP B1

### 5.4 Obrigações Acessórias — 6 tarefas (linhas 60–65)

| Tarefa | Prazo |
|---|---|
| EFD Contribuições | Dia 10 |
| EFD IPI e ICMS | Dia 10 |
| DCTFWeb / MIT | Dia 20 |
| ECD — Escrituração Contábil Digital | Junho |
| ECF — Escrituração Contábil Fiscal | Julho |
| Pesquisa IBGE — Empresas e Produtos | Julho |

### 5.5 Fiscal — 2 tarefas (linhas 67–68) — `Mensal`

- Identificar retenção de tributos em serviços tomados
- Gerar guias de impostos mensais

### 5.6 Sistema Domínio — 5 tarefas (linhas 70–74) — `Mensal`

- Importar notas de débito por planilha / arquivo TXT
- Importar documentos de saída para o Domínio
- Importar documentos de entrada para o Domínio
- Importar extratos bancários para o Domínio
- Lançamento de ajustes de créditos e débitos de ICMS no livro ICMS

### 5.7 Financeiro — 1 tarefa (linha 76) — `Diario`

- Solicitação de pagamentos no ASTER

### 5.8 Sistemas e ferramentas mapeados nas tarefas

| Ferramenta | Uso na matriz |
|---|---|
| **SAP / SAP Business One** | ERP: cadastros, pedidos, contratos, relatórios base do ICMS |
| **Domínio** | Sistema contábil/fiscal: importação de documentos e extratos, livro ICMS |
| **Arquivei** | Repositório/gestão de XML de notas fiscais |
| **ASTER** | Solicitação de pagamentos (financeiro) |
| **SicalcWeb** | Emissão de DARF |
| **Banco Itaú (portal)** | Confirmação de pagamento de pedidos de venda |
| **Microsoft Excel** | Controle de mensalidades de locação e a própria matriz |
| **E-mail / telefone / WhatsApp** | Canais de envio de ND/boletos e atendimento a clientes |
| Portais do Fisco | EFD Contribuições, EFD ICMS/IPI, DCTFWeb/MIT, ECD, ECF, ISS, IBGE |

---

## 6. Regras de negócio e de uso

**Preenchimento**

1. A única marcação válida é o número **`1`**. A célula funciona como caixa de seleção numérica —
   é o que permite que todos os indicadores sejam somas simples.
2. O preenchimento é **cumulativo e da esquerda para a direita**: nível 3 significa três células
   marcadas (`1 1 1`), nunca uma marcação isolada na terceira coluna.
3. Só o **gestor** altera a matriz. O colaborador se manifesta por formulário individual; o gestor
   compila, remove duplicidades e revisa antes de lançar.
4. Nenhum número de resumo é digitado: **linhas 3, 4, 5 e as colunas AG:AP são fórmulas** e não
   devem ser editadas.

**Interpretação**

5. **Semáforo com 0 ou 1 = vermelho.** Uma tarefa com apenas um executante é tratada como risco,
   não como normalidade.
6. A **meta institucional é 3 pessoas por tarefa** — é o que define o verde e é o divisor de todos
   os percentuais.
7. O total do colaborador é **pontuação de nível**, não contagem de tarefas. E, na comparação
   entre períodos, **a variação pesa mais que a posição**: quem evoluiu muito partindo de baixo
   demonstra mais do que quem lidera o ranking mas estagnou.
8. Cobertura no nível 1 não é cobertura: *três aprendizes e nenhum especialista* é um cenário de
   risco, ainda que o semáforo da primeira coluna esteja verde.
9. Colaboradores com total `0` permanecem na matriz (entrantes ou ainda não avaliados) e **puxam
   todos os percentuais para baixo** — é intencional, pois representam capacidade ainda não
   instalada.

**Transparência**

10. A matriz é **aberta à equipe**: cada colaborador enxerga o quadro dos colegas. Isso é
   deliberado e cumpre dupla função — gerar incentivo para alcançar o score do colega e indicar
   **a quem pedir ajuda** para aprender uma tarefa.

**Ciclo**

11. Uma aba por período; ao virar o mês, duplicar, renomear e ocultar a anterior. A aba do mês
    encerrado é **congelada** e serve de base de comparação para o mês seguinte.
12. A aba `Gráfico` deve receber uma nova coluna a cada período, apontando para a célula de total
    do colaborador na nova aba.
13. O uso final previsto é a **consolidação entre departamentos**, para uma visão de risco da
    empresa inteira (objetivo 9).

---

## 7. Diagnóstico atual — `Outubro 2026`

**Cobertura geral: 59,88%** (meta: 100% = 3 pessoas por tarefa em todos os 4 níveis)

Distribuição do semáforo entre as 64 tarefas, **nível a nível**:

| Nível | 🟢 Verde (≥3) | 🟡 Amarelo (2) | 🔴 Vermelho (0 ou 1) |
|---|---|---|---|
| **1** — Aprendendo | 14 | 39 | **11** |
| **2** — Faz com ajuda | 14 | 39 | **11** |
| **3** — Faz sozinho | 12 | 37 | **15** |
| **4** — Faz e ensina | 9 | 29 | **26** |

**A deterioração de 11 para 26 vermelhos entre o nível 1 e o nível 4 é o achado mais relevante do
mês.** Em 41% das tarefas do departamento há no máximo uma pessoa capaz de ensinar a atividade —
ou seja, a equipe cobre a operação do dia a dia, mas tem pouca capacidade de formar substitutos
por conta própria.

Três tarefas não têm **nenhum** especialista (nível 4 igual a zero):

- Confirmação de pagamento dos pedidos de venda com acesso ao banco Itaú *(Faturamento)*
- Lançamentos de Importação Simplificada — Courrier *(Recebimento)*
- Lançamento de ajustes de créditos e débitos de ICMS no livro ICMS *(Sistema Domínio)*

### Tarefas em vermelho — prioridade de ação

| Setor | Tarefa | Pessoas |
|---|---|---|
| Faturamento | Confirmação de pagamento dos pedidos de venda com acesso ao banco Itaú | **0** |
| Faturamento | Análise e controle das mensalidades de manutenção de equipamentos | 1 |
| Faturamento | Análise de possíveis reajustes contratuais (locação/manutenção) | 1 |
| Faturamento | Controle de retorno de comodato da Geneslab / emissão de NF de venda | 1 |
| Recebimento | Lançamentos de Importação Simplificada (Courrier) | 1 |
| Apuraç. Tribut. | Emissão de DARF através do SicalcWeb | 1 |
| Obrigaç. Acess. | ECD — Escrituração Contábil Digital | 1 |
| Obrigaç. Acess. | ECF — Escrituração Contábil Fiscal | 1 |
| Obrigaç. Acess. | Pesquisa IBGE — Empresas e Produtos | 1 |
| Sist. Domínio | Importar Notas de Débito por planilha / arquivo TXT | 1 |
| Sist. Domínio | Lançamento de ajustes de créditos e débitos de ICMS no livro ICMS | 1 |

Setores mais vulneráveis: **Obrigações Acessórias (45,83%)**, **Sistema Domínio (50,00%)** e
**Apuração Tributária (55,00%)** — justamente os de obrigações com prazo legal.

### Simulação de ausência (objetivo 7)

Aplicando o método descrito pelo gestor — zerar os pontos de um colaborador e reavaliar o
semáforo — este é o impacto da saída de cada pessoa sobre as 64 tarefas:

| Se sair… | Tarefas em vermelho | Tarefas **sem nenhum executante** |
|---|---|---|
| *(situação atual)* | 11 | 1 |
| Luis | 11 | 1 |
| Maykon | 11 | 1 |
| José Junior | 16 | 1 |
| **Alexandre** | **45** | **7** |
| **Pamella** | **50** | **5** |

A saída de Alexandre ou de Pamella levaria o departamento de 11 para cerca de 50 tarefas em
alerta — **mais de 70% de toda a operação**. São os dois pontos únicos de falha do departamento
hoje, e qualquer plano de férias, promoção ou desligamento precisa partir desse número.

> Luis e Maykon aparecem sem impacto porque suas colunas estão zeradas na aba de Outubro (ver
> item 7 da seção 8). Enquanto isso não for resolvido, a simulação para eles não é confiável.

---

## 8. Inconsistências detectadas na v2

Pontos que afetam a confiabilidade dos indicadores e que valem correção antes da próxima
apresentação:

| # | Onde | Problema | Correção sugerida |
|---|---|---|---|
| 1 | `AM4` — Apuraç. Tribut. | A fórmula soma `AG60:AJ65`, que são as linhas de **Obrigações Acessórias**, e não as linhas 54–58. O percentual exibido para Apuração Tributária não é dela. | `=SUM(AG54:AJ58)/(20*3)` |
| 2 | `AM3` — Recebimento | O intervalo `AG38:AJ51` **exclui a linha 52** (Emissão de NF de Importação Simplificada). O setor tem 15 tarefas, mas só 14 entram no cálculo. | `=SUM(AG38:AJ52)/(60*3)` |
| 3 | `AG5` — indicador global | O divisor `280` conta as **6 linhas em branco** (37, 53, 59, 66, 69, 75) como se fossem tarefas. O universo real é de 64 tarefas = 256 células. O percentual global está **subestimado**. | `/(256*3)` |
| 4 | Linha 37 | Linha sem tarefa, mas com fórmulas de semáforo e periodicidade `Diario` preenchida. | Limpar |
| 5 | Aba `Gráfico` | Não possui coluna para **Outubro 2026** nem linha para **José Junior**; ainda mantém **Kevin** e **Loraine**, que não estão na matriz atual. | Atualizar ao virar o mês |
| 6 | Gráfico (objeto) | Plota apenas **3 séries** (Kevin, Alexandre, Pamella). Luis, Maykon e Loraine estão na tabela mas fora do gráfico. | Reconfigurar as séries |
| 7 | Colunas de Luis e Maykon | Zeradas em Outubro 2026, embora o histórico registre 164 pontos para Luis até Set/26. Indica aba duplicada e ainda não preenchida. | Confirmar se é pendência de preenchimento |
| 8 | Toda a matriz | **Não há validação de dados**: qualquer valor pode ser digitado numa célula de marcação, e um `2` ou um `11` distorceria silenciosamente o semáforo. | Validação restringindo a `1` |
| 9 | Divisor fixo `*3` | Com 5 colaboradores na matriz, uma tarefa dominada por todos em nível 4 gera valor acima da meta e o percentual pode passar de 100%. | Avaliar se a meta é 3 ou "todos" |
| 10 | Textos | `Diario` sem acento, `manuntenção`, `Simpificada`, `Luis ` com espaço no final. | Padronizar |

---

## 9. Evolução da ferramenta

### 9.1 Requisitos apontados pelo gestor ainda não atendidos

| Origem | Requisito | Situação atual |
|---|---|---|
| Objetivo 1 | **Opção para cadastrar novos serviços dentro de cada categoria** da coluna `Setorização` | Hoje a inclusão é manual: inserir linha, replicar as fórmulas do semáforo e **corrigir os intervalos das fórmulas de setor**, que não se ajustam sozinhos |
| Objetivo 2 | Periodicidade com as opções **diário, semanal, mensal e anual** | A coluna existe, mas com valores livres e heterogêneos (`Diario`, `Mensal`, `Dia 10`, `Dia 20`, `Junho`, `Julho`) e **sem a opção semanal**. Falta padronizar em lista suspensa, separando *periodicidade* de *prazo de entrega* |
| Objetivo 5 | **Visibilidade dos quadros entre colaboradores** | Depende de como o arquivo é compartilhado. Para funcionar como incentivo, a matriz precisa circular aberta — o que exige proteger as fórmulas contra edição acidental |
| Objetivo 7 | **Simulação de ausência** de um colaborador | Feita manualmente. Um seletor que zere a coluna escolhida e recalcule o semáforo tornaria a análise imediata e reversível |
| Objetivo 9 | **Consolidação entre departamentos** | A matriz hoje cobre um departamento. O modelo já está pronto para replicação, mas falta a camada que soma os riscos de todas as áreas numa visão de empresa |

### 9.2 Sugestões adicionais

1. **Validação de dados** nas células de marcação e **proteção de planilha** nas áreas de fórmula
   (linhas 3–5, colunas AG:AP), deixando editável apenas a matriz.
2. **Legenda dos 4 níveis e das cores do semáforo visível na própria aba mensal** — hoje ela só
   existe na aba `Objetivos e Elaboração`.
3. **Lista automática de tarefas críticas** (semáforo 0 ou 1) numa área dedicada, funcionando como
   plano de ação do mês.
4. **Coluna de responsável principal e backup** por tarefa, tornando explícito o plano de
   contingência que hoje só se lê indiretamente pelo semáforo.
5. **Cruzar semáforo com periodicidade/prazo legal**: uma obrigação com prazo fixo (Dia 10, Dia 20)
   em vermelho é mais grave que uma tarefa diária em vermelho. Um indicador de criticidade
   ponderada tornaria a priorização mais justa.
6. **Aba de consolidação anual** puxando os percentuais globais de cada mês, para acompanhar a
   evolução da cobertura — hoje o gráfico acompanha pessoas, não cobertura.
7. **Padronizar a rotina de virada de mês** em um checklist (duplicar, renomear, ocultar anterior,
   acrescentar coluna no `Gráfico`, revisar séries), evitando as defasagens descritas na seção 8.

---

## 10. Glossário

| Termo | Significado |
|---|---|
| **Polivalência** | Capacidade de mais de um colaborador executar a mesma tarefa |
| **Semáforo** | Indicador de risco por tarefa: quantidade de pessoas que a dominam |
| **Setorização** | Agrupamento das tarefas por área responsável |
| **NF-e / NFS-e / ND / CT-e** | Nota Fiscal Eletrônica / de Serviço / Nota de Débito / Conhecimento de Transporte |
| **DIFAL** | Diferencial de alíquotas do ICMS em operações interestaduais |
| **DARF** | Documento de Arrecadação de Receitas Federais |
| **EFD** | Escrituração Fiscal Digital (Contribuições; ICMS/IPI) |
| **DCTFWeb / MIT** | Declaração de Débitos e Créditos Tributários Federais / Módulo de Inclusão de Tributos |
| **ECD / ECF** | Escrituração Contábil Digital / Escrituração Contábil Fiscal |
| **LCM** | Lançamento de guias e impostos |
| **Comodato** | Empréstimo gratuito de bem, com nota fiscal específica e posterior retorno |
| **Courrier** | Regime de importação simplificada por remessa expressa |
