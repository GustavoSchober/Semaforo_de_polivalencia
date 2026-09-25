create view semaforo as
select
  n.ciclo_id,
  n.tarefa_id,
  count(*) filter (where n.valor >= 1) as nivel_1,
  count(*) filter (where n.valor >= 2) as nivel_2,
  count(*) filter (where n.valor >= 3) as nivel_3,
  count(*) filter (where n.valor >= 4) as nivel_4
from nivel n
group by 1, 2;

E a cobertura por setor, que hoje são sete fórmulas escritas à mão com intervalos errados:

sql
create view cobertura_setor as
select
  s.ciclo_id, t.setor_id,
  sum(least(s.nivel_1,3) + least(s.nivel_2,3)
    + least(s.nivel_3,3) + least(s.nivel_4,3))::numeric
    / (count(*) * 4 * 3) as cobertura
from semaforo s
join tarefa t on t.id = s.tarefa_id
group by 1, 2;


