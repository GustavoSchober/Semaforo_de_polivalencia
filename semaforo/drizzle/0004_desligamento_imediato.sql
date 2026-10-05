-- ---------------------------------------------------------------------------
-- Desligar faz sumir, e o que sobra tem prazo de validade.
--
-- 1. O MÊS DA SAÍDA JÁ NÃO CONTA.
--    A regra anterior (`saida_em >= referencia`) mantinha a pessoa no ciclo do
--    próprio mês em que ela saiu: quem foi desligado dia 5 continuava ocupando
--    coluna na matriz, linha no simulador e cabeça no painel até o dia 1º
--    seguinte. Na prática o gestor via uma tarefa "coberta por 3" que, naquele
--    instante, tinha 2.
--
--    Agora a pessoa conta num ciclo apenas enquanto a referência do ciclo for
--    ANTERIOR ao mês da saída. Desligar repercute na hora, em todas as telas,
--    e os meses anteriores ao da saída continuam intactos — que é o que a
--    própria tela de cadastro já prometia em texto.
--
--    Consequência assumida: um ciclo já fechado em que alguém saiu no meio do
--    mês passa a ser recalculado sem essa pessoa. É uma correção, não uma
--    perda: aquele mês terminou sem ela.
--
-- 2. RETENÇÃO DE 3 MESES.
--    `saida_em` passa a ter uma data de expurgo derivada dela. Quem saiu há
--    mais de 3 meses é removido fisicamente — colaborador e níveis — pela
--    função `f_expurgar_desligados`. Até lá o dado continua inteiro e a
--    readmissão continua possível; depois, nem um nem outro.
--
--    É o único lugar do sistema em que algo é apagado de verdade, e existe por
--    uma razão explícita: sem teto, o banco acumula para sempre o quadro
--    completo de gente que não trabalha mais aqui.
-- ---------------------------------------------------------------------------

create or replace view v_nivel_vigente as
select n.*, c.departamento_id, c.referencia
from nivel n
join ciclo c        on c.id = n.ciclo_id
join colaborador co on co.id = n.colaborador_id
join tarefa t       on t.id = n.tarefa_id
where (co.saida_em is null or c.referencia < date_trunc('month', co.saida_em)::date)
  and (t.ativa_ate is null or t.ativa_ate >= c.referencia);
--> statement-breakpoint

-- Apaga quem saiu há mais de `p_meses` meses, e tudo que pendurava nele.
--
-- A ordem importa: `nivel.colaborador_id` é `on delete restrict` de propósito,
-- para que ninguém apague uma pessoa por acidente. O expurgo é a exceção
-- autorizada, então ele desfaz as referências na mão, numa transação só.
create or replace function f_expurgar_desligados(
  p_departamento bigint,
  p_meses int default 3
)
returns table (id bigint, nome text, saida_em date)
language plpgsql as $$
-- #variable_conflict use_column não resolveria: os nomes de saída colidem com
-- colunas reais de `colaborador`. As consultas abaixo são todas qualificadas.
declare
  v_corte date := (current_date - make_interval(months => p_meses))::date;
  v_ids bigint[];
begin
  select coalesce(array_agg(c.id), '{}')
    into v_ids
  from colaborador c
  where c.departamento_id = p_departamento
    and c.saida_em is not null
    and c.saida_em < v_corte;

  if cardinality(v_ids) = 0 then
    return;
  end if;

  -- devolvido ANTES do delete: depois dele não há mais de onde ler o nome
  return query
    select c.id, c.nome, c.saida_em from colaborador c where c.id = any(v_ids);

  -- referências que só registram autoria: perdem o autor, não a linha
  update nivel         n set atualizado_por = null where n.atualizado_por = any(v_ids);
  update ciclo         c set fechado_por    = null where c.fechado_por    = any(v_ids);
  update autoavaliacao a set decidido_por   = null where a.decidido_por   = any(v_ids);

  delete from autoavaliacao a where a.colaborador_id = any(v_ids);
  delete from nivel        n where n.colaborador_id = any(v_ids);
  delete from colaborador  c where c.id             = any(v_ids);
end;
$$;
