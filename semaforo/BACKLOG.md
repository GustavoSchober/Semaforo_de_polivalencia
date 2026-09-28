# Backlog

Aberto no primeiro dia, como manda a seção 12 da arquitetura: sem prazo, a ameaça
não é cortar escopo demais — é nunca fechar etapa nenhuma porque sempre tem algo
mais interessante para fazer. **Ideia anotada para de doer.**

> **Este arquivo é a fila de ideias soltas.** O estado do projeto — o que já está
> pronto, o que falta e por onde retomar — vive em `../ESTADO-DO-PROJETO.md`.
> Quando os dois discordarem, aquele vale.

## Perguntas em aberto para o gestor

Nenhuma bloqueia o trabalho atual, mas as três primeiras mudam fórmulas.

- [ ] **A cobertura pode passar de 100%?** Implementado como opção A (`least(n,3)`,
      seção 7.1). Os percentuais vão divergir dos que ele já apresentou — mostrar
      antes, depois e a causa, lado a lado.
- [ ] **A meta de 3 muda se o departamento tiver 3 pessoas?** Sem resposta boa.
      `min(3, n-1)` torna o indicador incomparável entre departamentos, o que
      atrapalha o objetivo 9.
- [ ] **Validar a fórmula de `criticidade()`.** É proposta da arquitetura, não da
      documentação funcional. Hoje só ordena a lista de ação; não é indicador
      publicado, e não deve virar um sem validação.
- [ ] Tarefa pode pertencer a mais de um setor? ("Análise de impostos e tributações
      das operações em geral" parece transversal.)
- [ ] A diretoria vê nome de pessoa ou só o agregado por setor? Muda a tela e tem
      implicação de privacidade.
- [ ] Existe AD local na empresa? Decide o ADR-005.
- [ ] Existe servidor interno disponível, e quem o administra?

## Decisões técnicas pendentes

- [ ] **Pré-popular `nivel` ao abrir o ciclo, ou inserir sob demanda?** (seção 4.4)
      O `seed-dev` pré-popula. Reavaliar ao escrever a tela da matriz — é quando a
      resposta fica óbvia.
- [ ] Declarar as views no schema Drizzle como tabelas somente leitura, para
      recuperar a tipagem que o ADR-008 custa. Hoje as consultas usam `db.execute`
      com tipo declarado à mão.
- [ ] `peso_criticidade` do catálogo (2 e 3 para obrigações com prazo legal) foi
      arbitrado por mim, não pelo gestor. Cai junto com a validação da criticidade.

## Próximos passos, em ordem de dependência

- [ ] **Login (ADR-005).** `lib/auth/sessao.ts` devolve um usuário fixo. As
      permissões já estão escritas e testadas; falta só quem é a pessoa.
- [ ] **Abrir e fechar ciclo pela interface**, com a regra 7.4 (copiar valores e
      zerar `avaliado`). Hoje só por SQL.
- [ ] **CRUD de tarefa, setor e pessoa** — é o objetivo 1, e o contraste com a
      planilha (inserir linha, replicar fórmulas, corrigir intervalos) é o que
      vale mostrar na demonstração.
- [ ] **Deploy.** Os arquivos existem em `docker/`; falta o servidor, o nome
      interno e o certificado. A seção 12 insiste que isso aconteça cedo.
- [ ] **Autoavaliação do colaborador** (etapa 5). Elimina o passo 3 do processo.

## Funcionalidades (ordem aproximada de valor por esforço)

1. [ ] Tela "quem pode me ensinar isso" — escolho a tarefa, vejo quem está em
       nível 4. É o objetivo 5 materializado e é o que faz o colaborador abrir a
       ferramenta por vontade própria.
2. [ ] Exportação em PDF e xlsx do painel, para apresentação.
3. [ ] Responsável principal e backup por tarefa.
4. [ ] Consolidação entre departamentos (objetivo 9). A coluna já existe.
5. [ ] Alertas: tarefa que entrou em vermelho desde o ciclo anterior; colaborador
       sem evolução há N ciclos. Depende de SMTP interno — verificar se existe
       antes de prometer.
6. [ ] LDAP no lugar de Credentials, se houver AD local.
7. [ ] Importação do histórico célula a célula (opção C da seção 11.4). Caro e
       ninguém pediu.
8. [ ] Prazo estruturado em vez de texto livre, com calendário fiscal e dia útil.
9. [ ] Trilha de auditoria (`nivel_historico`).
10. [ ] `pontuacao_historica` com os 66 números da aba `Gráfico` — dá 14 meses de
        história ao gráfico de evolução sem nenhum importador. Custa uma hora.

## Front end — pendências

- [ ] **Cadastro de setor não tem tela.** Pessoa, tarefa e ciclo têm; setor
      continua por SQL, então uma tarefa nova só entra em setor que já existe.
- [ ] **O cabeçalho de coluna da matriz não gruda mais.** Foi removido junto com
      o shell de altura fixa, que era a causa da tela preta. Em 64 linhas, perder
      os nomes das colunas ao rolar incomoda; refazer exige um scrollport que não
      reintroduza o bug.
- [ ] Nenhuma tela foi inspecionada em build de produção — todas as capturas são
      `next dev`. Rodar `npm run build && npm start` e revisar.
- [ ] O cabeçalho de aço quebra em três linhas a 390px.

## Front end — pendências da reconstrução anterior

A interface foi refeita do zero sobre o mundo visual "Painel Split-Flap" (ver
`DESIGN.md` e `.impeccable/surfaces/app.md`). O que ficou em aberto:

- [ ] **O cabeçalho preso da matriz nunca foi visto colado.** O mecanismo está
      correto no código (a área da tabela é o scrollport, `top` medido dentro
      dela, fundo na célula e não na fileira), mas todas as capturas de revisão
      foram do topo do documento. Rolar a matriz e conferir.
- [ ] **Nenhuma tela foi inspecionada em build de produção** — todas as capturas
      são `next dev`. Rodar `npm run build && npm start` e revisar.
- [ ] **Celular e projetor são v2 declarada.** Abaixo de 48rem a moldura fixa é
      desligada e a página rola normal, o que funciona; falta acabamento. O
      cabeçalho de aço quebra em três linhas a 390px e empurra a primeira linha
      de dados para baixo.
- [ ] **A autoavaliação do colaborador não tem back end.** O usuário confirmou
      que é a EQUIPE quem mais preenche, não o gestor — hoje `podeEditarMatriz`
      libera só o gestor. O desenho já acomoda; a habilitação depende do ADR-005.
- [ ] **A visão consolidada da empresa não tem tela.** Também confirmada como
      necessidade do gestor nesta rodada.
- [ ] Um ciclo com muitas células sem avaliação derruba os pontos de uma pessoa
      e aparece como regressão na tela de evolução. Hoje a tela avisa em texto.
      Se deve plotar um ciclo mal preenchido é decisão do gestor, não da
      interface.
- [ ] A linha do contador de cobertura no painel alinha os dígitos numa coluna
      diferente das quatro fileiras abaixo dele. Lê como cabeçalho, que é o que
      ele é — mas alinhar faria a faixa virar um objeto só.

## Dívida consciente

- `prazo_ancora` é texto livre (decisão 7.2). Modelar prazo direito significa
  distinguir "dia 10 de todo mês", "todo junho", "quinto dia útil" e antecipação
  para dia não útil — um mini-domínio de calendário fiscal. **Isto é escolha, não
  descuido.**
- 4 vulnerabilidades moderadas de `esbuild`, transitivas do `drizzle-kit`. Afetam
  só o dev-server do esbuild, não a aplicação. O `audit fix --force` rebaixaria o
  drizzle-kit de 0.31 para 0.18. Reavaliar quando o drizzle-kit atualizar.
