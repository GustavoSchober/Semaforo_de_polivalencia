-- ---------------------------------------------------------------------------
-- Vigência e herança.
--
-- Duas mudanças, as duas de regra de negócio:
--
-- 1. QUEM SAIU PARA DE CONTAR, MAS SÓ DAQUI PARA A FRENTE.
--    A camada de cálculo contava todas as linhas de `nivel`, então desligar
--    alguém não mexia em nenhum indicador — o gestor via 3 pessoas cobrindo
--    uma tarefa que, na prática, tinha 2. Agora o colaborador conta num ciclo
--    apenas enquanto não tiver saído ANTES daquele ciclo. Setembro continua
--    dizendo o que era verdade em setembro; outubro passa a dizer a verdade de
--    outubro. É o que mantém o ciclo fechado imutável e ao mesmo tempo faz o
--    desligamento repercutir na hora.
--    A mesma regra vale para a tarefa: fora da vigência, fora da conta.
--
-- 2. NÍVEL HERDADO NA VIRADA DO MÊS.
--    `origem` ganha o valor 'herdado'. Ele vale para o cálculo (a cobertura não
--    despenca todo dia 1º) mas a interface o declara como herdado até alguém
--    confirmar no mês novo. É o mesmo princípio do campo `avaliado`: o dado
--    existe, e o quanto se pode confiar nele é dito em voz alta.
-- ---------------------------------------------------------------------------

alter type origem_nivel add value if not exists 'herdado';
--> statement-breakpoint

drop view if exists v_evolucao_cobertura;
--> statement-breakpoint
drop view if exists v_evolucao;
--> statement-breakpoint
drop view if exists v_pontuacao;
--> statement-breakpoint
drop view if exists v_cobertura_departamento;
--> statement-breakpoint
drop view if exists v_cobertura_setor;
--> statement-breakpoint
drop view if exists v_semaforo;
--> statement-breakpoint

-- Uma linha de `nivel` só entra em qualquer conta se a pessoa e a tarefa
-- estavam vigentes naquele ciclo. Toda a camada acima herda o filtro por
-- construção, o que é o motivo de ele morar aqui e não em cada consulta.
create view v_nivel_vigente as
select n.*, c.departamento_id, c.referencia
from nivel n
join ciclo c        on c.id = n.ciclo_id
join colaborador co on co.id = n.colaborador_id
join tarefa t       on t.id = n.tarefa_id
where (co.saida_em is null or co.saida_em >= c.referencia)
  and (t.ativa_ate is null or t.ativa_ate >= c.referencia)
  and t.ativa_desde < (c.referencia + interval '1 month');
--> statement-breakpoint

create view v_semaforo as
select
  n.ciclo_id,
  n.tarefa_id,
  count(*) filter (where n.avaliado and n.valor >= 1)::int as nivel_1,
  count(*) filter (where n.avaliado and n.valor >= 2)::int as nivel_2,
  count(*) filter (where n.avaliado and n.valor >= 3)::int as nivel_3,
  count(*) filter (where n.avaliado and n.valor >= 4)::int as nivel_4,
  count(*) filter (where n.avaliado)::int                  as avaliados,
  count(*) filter (where n.origem = 'herdado')::int         as herdados,
  count(*)::int                                            as elegiveis
from v_nivel_vigente n
group by 1, 2;
--> statement-breakpoint

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

create view v_pontuacao as
select
  ciclo_id,
  colaborador_id,
  sum(valor)::int                          as pontos,
  count(*) filter (where valor >= 3)::int  as tarefas_autonomas,
  count(*) filter (where valor  = 4)::int  as tarefas_que_ensina,
  count(*)::int                            as tarefas_avaliadas
from v_nivel_vigente
where avaliado
group by 1, 2;
--> statement-breakpoint

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

-- A simulação herda o mesmo filtro de vigência: sem isso, remover uma pessoa
-- já desligada "pioraria" o cenário duas vezes.
create or replace function f_semaforo_simulado(p_ciclo bigint, p_ausentes bigint[])
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
  from v_nivel_vigente n
  where n.ciclo_id = p_ciclo
    and not (n.colaborador_id = any(coalesce(p_ausentes, '{}'::bigint[])))
  group by n.tarefa_id;
$$;
