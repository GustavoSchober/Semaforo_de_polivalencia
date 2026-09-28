-- ---------------------------------------------------------------------------
-- Corrige o filtro de vigência introduzido em 0002.
--
-- A condição `t.ativa_desde < (referencia + 1 mês)` parecia simétrica ao
-- `ativa_ate`, e não é. `ativa_desde` recebe `current_date` no cadastro, então
-- toda tarefa passa a "nascer hoje" — e qualquer ciclo anterior a hoje perde
-- todas as suas linhas. Na prática o ciclo de agosto sumiu dos indicadores.
--
-- O filtro por início é redundante de qualquer forma: uma tarefa só tem linha
-- em `nivel` nos ciclos em que ela já existia. O fim da vigência, esse sim,
-- precisa ser filtrado, porque a linha continua existindo depois que a tarefa
-- sai do catálogo.
-- ---------------------------------------------------------------------------

create or replace view v_nivel_vigente as
select n.*, c.departamento_id, c.referencia
from nivel n
join ciclo c        on c.id = n.ciclo_id
join colaborador co on co.id = n.colaborador_id
join tarefa t       on t.id = n.tarefa_id
where (co.saida_em is null or co.saida_em >= c.referencia)
  and (t.ativa_ate is null or t.ativa_ate >= c.referencia);
