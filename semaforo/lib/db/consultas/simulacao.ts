import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { farol } from '@/lib/dominio/farol';
import { cobertura } from '@/lib/dominio/cobertura';

export type LinhaSimulada = {
  tarefaId: number;
  descricao: string;
  setor: string;
  nivel1: number;
  nivel2: number;
  nivel3: number;
  nivel4: number;
};

export type Cenario = {
  cobertura: number | null;
  /** tarefas com no máximo uma pessoa capaz de operar sozinha (nível 3) */
  vermelhas: number;
  /** tarefas que ninguém executa em nenhum nível */
  semNinguem: number;
  semEspecialista: number;
  linhas: LinhaSimulada[];
};

/**
 * O semáforo do ciclo removendo um conjunto de pessoas.
 *
 * Com a lista vazia devolve a situação atual, o que dá o "antes" e o "depois"
 * pela mesma função — e garante que os dois lados da comparação são calculados
 * exatamente do mesmo jeito.
 */
export async function simular(cicloId: number, ausentes: number[]): Promise<Cenario> {
  // a lista vem da interface; nada além de inteiros chega ao SQL
  const ids = ausentes.filter((n) => Number.isInteger(n) && n > 0);

  const linhas = await db.execute<{
    tarefa_id: string;
    descricao: string;
    setor: string;
    nivel_1: number;
    nivel_2: number;
    nivel_3: number;
    nivel_4: number;
  }>(sql`
    select f.tarefa_id, t.descricao, s.nome as setor,
           f.nivel_1, f.nivel_2, f.nivel_3, f.nivel_4
    from f_semaforo_simulado(${cicloId}, ${sql.param(ids)}::bigint[]) f
    join tarefa t on t.id = f.tarefa_id
    join setor  s on s.id = t.setor_id
    order by s.ordem, t.ordem
  `);

  const mapeadas: LinhaSimulada[] = linhas.map((l) => ({
    tarefaId: Number(l.tarefa_id),
    descricao: l.descricao,
    setor: l.setor,
    nivel1: l.nivel_1,
    nivel2: l.nivel_2,
    nivel3: l.nivel_3,
    nivel4: l.nivel_4,
  }));

  return {
    cobertura: cobertura(
      mapeadas.map((l) => ({
        nivel_1: l.nivel1,
        nivel_2: l.nivel2,
        nivel_3: l.nivel3,
        nivel_4: l.nivel4,
      })),
    ),
    vermelhas: mapeadas.filter((l) => farol(l.nivel3) === 'vermelho').length,
    semNinguem: mapeadas.filter((l) => l.nivel1 === 0).length,
    semEspecialista: mapeadas.filter((l) => l.nivel4 === 0).length,
    linhas: mapeadas,
  };
}

export type PessoaSimulavel = {
  id: number;
  nome: string;
  pendentes: number;
  totalCelulas: number;
};

export async function pessoasDoCiclo(cicloId: number): Promise<PessoaSimulavel[]> {
  const linhas = await db.execute<{
    id: string;
    nome: string;
    pendentes: number;
    total: number;
  }>(sql`
    select c.id, c.nome,
           count(*) filter (where not n.avaliado)::int as pendentes,
           count(*)::int as total
    from colaborador c
    join v_nivel_vigente n on n.colaborador_id = c.id and n.ciclo_id = ${cicloId}
    group by c.id, c.nome
    order by c.nome
  `);
  return linhas.map((l) => ({
    id: Number(l.id),
    nome: l.nome,
    pendentes: l.pendentes,
    totalCelulas: l.total,
  }));
}
