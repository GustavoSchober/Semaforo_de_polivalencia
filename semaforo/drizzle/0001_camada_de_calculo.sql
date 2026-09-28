-- ---------------------------------------------------------------------------
-- Camada de cálculo — seção 5 da arquitetura.
--
-- Nada que seja calculável é armazenado. O banco guarda uma única coisa: o
-- nível de cada pessoa, em cada tarefa, em cada ciclo. Todo o resto mora aqui,
-- e por morar aqui não pode desatualizar.
-- ---------------------------------------------------------------------------

-- Semáforo por tarefa — equivale às colunas AG:AJ da planilha.
--
-- Como o nível é cumulativo, quem está no 4 também atingiu 1, 2 e 3. Logo
-- "quantas pessoas no nível k" é count(*) where valor >= k, e não uma soma de
-- células espalhadas por cinco blocos de colunas.
create view v_semaforo as
select
  n.ciclo_id,
  n.tarefa_id,
  count(*) filter (where n.avaliado and n.valor >= 1)::int as nivel_1,
  count(*) filter (where n.avaliado and n.valor >= 2)::int as nivel_2,
  count(*) filter (where n.avaliado and n.valor >= 3)::int as nivel_3,
  count(*) filter (where n.avaliado and n.valor >= 4)::int as nivel_4,
  count(*) filter (where n.avaliado)::int                  as avaliados,
  count(*)::int                                            as elegiveis
from nivel n
group by 1, 2;
--> statement-breakpoint

-- Cobertura por setor.
--
-- O denominador é count(*) * 4 * 3 — tarefas × níveis × meta de 3 pessoas.
-- Substitui os divisores (120*3), (56*3), (20*3) escritos à mão, que são a
-- causa das inconsistências 1, 2 e 3. Nunca mais fica defasado quando uma
-- tarefa entra ou sai.
--
-- least(x, 3) trava o numerador na meta: é a opção A da seção 7.1, e é decisão
-- de negócio. nullif evita divisão por zero em setor sem tarefa vigente.
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
--> statement-breakpoint

-- Indicador global do departamento — equivale à célula AG5.
create view v_cobertura_departamento as
select
  c.id as ciclo_id,
  c.departamento_id,
  count(*)::int as tarefas,
  sum( least(s.nivel_1,3) + least(s.nivel_2,3)
     + least(s.nivel_3,3) + least(s.nivel_4,3) )::numeric
    / nullif(count(*) * 4 * 3, 0) as cobertura
from v_semaforo s
join ciclo c on c.id = s.ciclo_id
group by 1, 2;
--> statement-breakpoint

-- Pontuação do colaborador — a linha 4 da planilha.
--
-- As duas colunas extras respondem à advertência da seção 3.4 da documentação
-- funcional: "cobertura no nível 1 não é cobertura". 208 pontos não diz nada;
-- "domina 41 tarefas sozinho e ensina 28" diz.
create view v_pontuacao as
select
  ciclo_id,
  colaborador_id,
  sum(valor)::int                          as pontos,
  count(*) filter (where valor >= 3)::int  as tarefas_autonomas,
  count(*) filter (where valor  = 4)::int  as tarefas_que_ensina,
  count(*)::int                            as tarefas_avaliadas
from nivel
where avaliado
group by 1, 2;
--> statement-breakpoint

-- Evolução entre ciclos — substitui a aba Gráfico e o ritual de acrescentar
-- coluna à mão todo mês.
--
-- O lag() entrega a VARIAÇÃO, e a documentação funcional é enfática: "a leitura
-- decisiva não é a posição, é a inclinação".
create view v_evolucao as
select
  p.colaborador_id,
  c.departamento_id,
  c.id as ciclo_id,
  c.referencia,
  p.pontos,
  p.pontos - lag(p.pontos) over (
    partition by p.colaborador_id order by c.referencia
  ) as variacao
from v_pontuacao p
join ciclo c on c.id = p.ciclo_id;
--> statement-breakpoint

-- Evolução da própria cobertura do departamento (sugestão 6 da seção 9.2:
-- hoje o gráfico acompanha pessoas, não cobertura).
create view v_evolucao_cobertura as
select
  d.departamento_id,
  c.referencia,
  d.cobertura,
  d.cobertura - lag(d.cobertura) over (
    partition by d.departamento_id order by c.referencia
  ) as variacao
from v_cobertura_departamento d
join ciclo c on c.id = d.ciclo_id;
--> statement-breakpoint

-- Simulação de ausência — o recurso que justifica o projeto.
--
-- Função, não view, porque recebe parâmetro. Aceita VÁRIAS pessoas ao mesmo
-- tempo, o que responde à pergunta que o gestor realmente tem: "posso aprovar
-- as férias dos dois na mesma semana?" — e que a planilha não responde sem uma
-- hora de trabalho.
create function f_semaforo_simulado(p_ciclo bigint, p_ausentes bigint[])
returns table (
  tarefa_id bigint,
  nivel_1 int,
  nivel_2 int,
  nivel_3 int,
  nivel_4 int
)
language sql stable as $$
  select
    n.tarefa_id,
    count(*) filter (where n.avaliado and n.valor >= 1)::int,
    count(*) filter (where n.avaliado and n.valor >= 2)::int,
    count(*) filter (where n.avaliado and n.valor >= 3)::int,
    count(*) filter (where n.avaliado and n.valor >= 4)::int
  from nivel n
  where n.ciclo_id = p_ciclo
    and not (n.colaborador_id = any(coalesce(p_ausentes, '{}'::bigint[])))
  group by n.tarefa_id;
$$;
