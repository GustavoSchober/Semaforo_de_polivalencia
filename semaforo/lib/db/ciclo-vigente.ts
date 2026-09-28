import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export type CicloVigente = {
  id: number;
  referencia: string;
  status: 'aberto' | 'fechado';
  departamentoId: number;
  /** true quando esta chamada foi a que virou o mês. */
  viradoAgora: boolean;
};

/**
 * A virada do mês, sem ninguém para virar.
 *
 * O ciclo do mês corrente existe porque o relógio diz que é aquele mês, e não
 * porque alguém lembrou de abrir. Na primeira vez que qualquer pessoa alcança o
 * sistema depois da meia-noite do dia 1º, três coisas acontecem numa transação:
 *
 *   1. todo ciclo aberto de mês anterior é FECHADO e congelado;
 *   2. o ciclo do mês corrente é aberto;
 *   3. os níveis do último ciclo são HERDADOS — copiados com `origem` marcada
 *      como 'herdado'.
 *
 * Herdar em vez de zerar é decisão de produto: a cobertura não pode despencar a
 * zero todo dia 1º, senão o painel de risco fica inutilizável nas primeiras
 * semanas de cada mês e a curva de evolução ganha um buraco mensal. Mas o dado
 * herdado não se disfarça de dado novo — `origem = 'herdado'` é o que permite à
 * interface dizer, em voz alta, quanto daquele número ainda é do mês passado.
 *
 * Não há cron nem agendador: a checagem acontece no primeiro acesso do mês. Em
 * um departamento com cinco pessoas isso custa uma consulta por requisição e
 * não depende de nenhuma infraestrutura que o servidor interno não tenha.
 *
 * O lock consultivo existe porque duas abas abertas ao mesmo tempo no dia 1º
 * chamariam esta função em paralelo. Sem ele, as duas veriam "não existe" e as
 * duas tentariam criar.
 */
export async function garantirCicloDoMes(
  departamentoId: number,
): Promise<CicloVigente | null> {
  // O ciclo vigente é o MAIS RECENTE, não o do mês do relógio.
  //
  // Parece a mesma coisa e não é: um ciclo pode existir adiante do calendário
  // (o seed do projeto abre outubro enquanto o relógio ainda diz setembro), e
  // uma função que perseguisse o mês corrente devolveria setembro — fechado —
  // como se fosse o ciclo de trabalho. Foi exatamente esse o defeito que
  // deixou um colaborador recém-cadastrado sem nenhuma célula: ele foi
  // cadastrado no ciclo errado, que por cima estava fechado.
  //
  // A regra é: se já existe ciclo igual ou posterior ao mês corrente, ele é o
  // vigente. Só quando o mais recente ficou para trás é que o mês virou.
  const maisRecente = await cicloMaisRecente(departamentoId);
  if (maisRecente && maisRecente.referencia >= primeiroDiaDoMes()) {
    return { ...maisRecente, viradoAgora: false };
  }

  return db.transaction(async (tx) => {
    // serializa a virada entre requisições concorrentes; liberado no commit
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('virada-de-ciclo:' || ${departamentoId}::text))`,
    );

    // outra requisição pode ter virado o mês enquanto esperávamos o lock
    const [jaExiste] = await tx.execute<LinhaCiclo>(sql`
      select id, referencia::text, status, departamento_id
      from ciclo
      where departamento_id = ${departamentoId}
        and referencia >= date_trunc('month', current_date)::date
      order by referencia desc
      limit 1
    `);
    if (jaExiste) return { ...mapear(jaExiste), viradoAgora: false };

    // o ciclo mais recente é a origem da herança
    const [origem] = await tx.execute<{ id: string }>(sql`
      select id from ciclo
      where departamento_id = ${departamentoId}
        and referencia < date_trunc('month', current_date)::date
      order by referencia desc
      limit 1
    `);

    // nada aberto do passado sobrevive à virada
    await tx.execute(sql`
      update ciclo
      set status = 'fechado', fechado_em = now()
      where departamento_id = ${departamentoId}
        and status = 'aberto'
        and referencia < date_trunc('month', current_date)::date
    `);

    const [novo] = await tx.execute<LinhaCiclo>(sql`
      insert into ciclo (departamento_id, referencia, status)
      values (${departamentoId}, date_trunc('month', current_date)::date, 'aberto')
      returning id, referencia::text, status, departamento_id
    `);

    // O produto cartesiano de quem está e do que existe HOJE — e não uma cópia
    // literal do mês passado. Assim, quem entrou no meio do mês aparece com o
    // quadro em branco, e quem saiu não é ressuscitado pela herança.
    await tx.execute(sql`
      insert into nivel (ciclo_id, tarefa_id, colaborador_id, valor, avaliado, origem)
      select
        ${Number(novo.id)},
        t.id,
        c.id,
        coalesce(a.valor, 0),
        coalesce(a.avaliado, false),
        case when a.valor is null then 'gestor'::origem_nivel
             else 'herdado'::origem_nivel end
      from tarefa t
      join setor s on s.id = t.setor_id and s.departamento_id = ${departamentoId}
      cross join colaborador c
      left join nivel a
        on a.ciclo_id = ${origem ? Number(origem.id) : null}
       and a.tarefa_id = t.id
       and a.colaborador_id = c.id
      where c.departamento_id = ${departamentoId}
        and c.saida_em is null
        and t.ativa_ate is null
      on conflict do nothing
    `);

    return { ...mapear(novo), viradoAgora: true };
  });
}

type LinhaCiclo = {
  id: string;
  referencia: string;
  status: 'aberto' | 'fechado';
  departamento_id: string;
};

function mapear(l: LinhaCiclo) {
  return {
    id: Number(l.id),
    referencia: l.referencia,
    status: l.status,
    departamentoId: Number(l.departamento_id),
  };
}

/** O primeiro dia do mês corrente, no fuso do servidor, em ISO. */
function primeiroDiaDoMes() {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${hoje.getFullYear()}-${mes}-01`;
}

async function cicloMaisRecente(departamentoId: number) {
  const [l] = await db.execute<LinhaCiclo>(sql`
    select id, referencia::text, status, departamento_id
    from ciclo
    where departamento_id = ${departamentoId}
    order by referencia desc
    limit 1
  `);
  return l ? mapear(l) : null;
}

/**
 * Quantas células do ciclo ainda carregam o nível herdado do mês anterior.
 *
 * É o número que separa "76% de cobertura" de "76% de cobertura, e nada disso
 * foi confirmado este mês".
 */
export async function celulasHerdadas(cicloId: number) {
  const [l] = await db.execute<{ herdadas: number; total: number }>(sql`
    select count(*) filter (where origem = 'herdado')::int as herdadas,
           count(*)::int as total
    from v_nivel_vigente
    where ciclo_id = ${cicloId}
  `);
  return { herdadas: l?.herdadas ?? 0, total: l?.total ?? 0 };
}
