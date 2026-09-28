import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export type PontoEvolucao = {
  referencia: string;
  pontos: number;
  variacao: number | null;
};

export type SerieColaborador = {
  colaboradorId: number;
  nome: string;
  pontos: PontoEvolucao[];
};

/** A aba `Gráfico`, que deixa de precisar de uma coluna nova a cada mês. */
export async function evolucaoDosColaboradores(
  departamentoId: number,
): Promise<SerieColaborador[]> {
  const linhas = await db.execute<{
    colaborador_id: string;
    nome: string;
    referencia: string;
    pontos: number;
    variacao: number | null;
  }>(sql`
    select e.colaborador_id, c.nome, e.referencia, e.pontos, e.variacao
    from v_evolucao e
    join colaborador c on c.id = e.colaborador_id
    where e.departamento_id = ${departamentoId}
    order by c.nome, e.referencia
  `);

  const series = new Map<number, SerieColaborador>();
  for (const l of linhas) {
    const id = Number(l.colaborador_id);
    let s = series.get(id);
    if (!s) {
      s = { colaboradorId: id, nome: l.nome, pontos: [] };
      series.set(id, s);
    }
    s.pontos.push({
      referencia: l.referencia,
      pontos: l.pontos,
      variacao: l.variacao === null ? null : Number(l.variacao),
    });
  }
  return [...series.values()];
}

/**
 * A evolução da própria cobertura do departamento.
 *
 * Hoje o gráfico da planilha acompanha pessoas, não cobertura — é a sugestão 6
 * da seção 9.2 da documentação funcional, e sai de graça da view.
 */
export async function evolucaoDaCobertura(departamentoId: number) {
  const linhas = await db.execute<{
    referencia: string;
    cobertura: string;
    variacao: string | null;
  }>(sql`
    select referencia, cobertura, variacao
    from v_evolucao_cobertura
    where departamento_id = ${departamentoId}
    order by referencia
  `);
  return linhas.map((l) => ({
    referencia: l.referencia,
    cobertura: Number(l.cobertura),
    variacao: l.variacao === null ? null : Number(l.variacao),
  }));
}
