import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

import type { PessoaEmTarefa } from '@/lib/dominio/elenco';

/** O mesmo formato de `lib/dominio/elenco`, reexportado para as consultas. */
export type PessoaNaTarefa = PessoaEmTarefa;

/**
 * Quem está em cada tarefa, com que nível.
 *
 * Existe porque "3 pessoas operam sozinhas" é uma informação pela metade: o
 * gestor precisa saber QUEM, senão não consegue nem pedir ajuda nem planejar um
 * treinamento. Uma consulta só para o ciclo inteiro — são 320 linhas nesta
 * escala, e agrupar em memória custa menos que 64 idas ao banco.
 *
 * Usa `v_nivel_vigente`, então quem saiu do departamento já não aparece.
 */
export async function pessoasPorTarefa(
  cicloId: number,
): Promise<Map<number, PessoaNaTarefa[]>> {
  const linhas = await db.execute<{
    tarefa_id: string;
    colaborador_id: string;
    nome: string;
    valor: number;
    avaliado: boolean;
    origem: string;
  }>(sql`
    select n.tarefa_id, n.colaborador_id, c.nome, n.valor, n.avaliado, n.origem
    from v_nivel_vigente n
    join colaborador c on c.id = n.colaborador_id
    where n.ciclo_id = ${cicloId}
    order by n.valor desc, c.nome
  `);

  const mapa = new Map<number, PessoaNaTarefa[]>();
  for (const l of linhas) {
    const tarefaId = Number(l.tarefa_id);
    const lista = mapa.get(tarefaId) ?? [];
    lista.push({
      colaboradorId: Number(l.colaborador_id),
      nome: l.nome,
      valor: l.valor,
      avaliado: l.avaliado,
      herdado: l.origem === 'herdado',
    });
    mapa.set(tarefaId, lista);
  }
  return mapa;
}
