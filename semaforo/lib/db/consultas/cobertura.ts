import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export type CoberturaSetor = {
  setor: string;
  tarefas: number;
  cobertura: number;
};

/** Cobertura por setor, do pior para o melhor — a ordem que o gestor precisa. */
export async function coberturaPorSetor(cicloId: number): Promise<CoberturaSetor[]> {
  const linhas = await db.execute<{ setor: string; tarefas: number; cobertura: string }>(sql`
    select s.nome as setor, v.tarefas, v.cobertura
    from v_cobertura_setor v
    join setor s on s.id = v.setor_id
    where v.ciclo_id = ${cicloId}
    order by v.cobertura asc
  `);
  return linhas.map((l) => ({
    setor: l.setor,
    tarefas: l.tarefas,
    cobertura: Number(l.cobertura),
  }));
}

/** O indicador global — equivale à célula AG5 da planilha. */
export async function coberturaDoDepartamento(cicloId: number) {
  const [linha] = await db.execute<{ tarefas: number; cobertura: string }>(sql`
    select tarefas, cobertura from v_cobertura_departamento where ciclo_id = ${cicloId}
  `);
  if (!linha) return null;
  return { tarefas: linha.tarefas, cobertura: Number(linha.cobertura) };
}

export type CelulasPendentes = { pendentes: number; total: number };

/**
 * Quantas células ainda não foram avaliadas neste ciclo.
 *
 * É a opção conservadora da seção 7.3: não avaliado conta como zero na
 * cobertura, mas a tela precisa dizer isso em voz alta. Sem este aviso, um
 * ciclo mal preenchido parece um departamento em colapso.
 */
export async function celulasPendentes(cicloId: number): Promise<CelulasPendentes> {
  const [l] = await db.execute<{ pendentes: number; total: number }>(sql`
    select count(*) filter (where not avaliado)::int as pendentes,
           count(*)::int as total
    from nivel where ciclo_id = ${cicloId}
  `);
  return { pendentes: l?.pendentes ?? 0, total: l?.total ?? 0 };
}
