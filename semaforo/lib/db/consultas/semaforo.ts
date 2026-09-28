import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export type LinhaSemaforo = {
  tarefaId: number;
  descricao: string;
  setor: string;
  periodicidade: string;
  prazoAncora: string | null;
  peso: number;
  nivel1: number;
  nivel2: number;
  nivel3: number;
  nivel4: number;
  avaliados: number;
  elegiveis: number;
};

/** O semáforo do ciclo, tarefa a tarefa, já agrupado por setor. */
export async function semaforoDoCiclo(cicloId: number): Promise<LinhaSemaforo[]> {
  const linhas = await db.execute<{
    tarefa_id: string;
    descricao: string;
    setor: string;
    periodicidade: string;
    prazo_ancora: string | null;
    peso_criticidade: string;
    nivel_1: number;
    nivel_2: number;
    nivel_3: number;
    nivel_4: number;
    avaliados: number;
    elegiveis: number;
  }>(sql`
    select v.tarefa_id, t.descricao, s.nome as setor,
           t.periodicidade, t.prazo_ancora, t.peso_criticidade,
           v.nivel_1, v.nivel_2, v.nivel_3, v.nivel_4, v.avaliados, v.elegiveis
    from v_semaforo v
    join tarefa t on t.id = v.tarefa_id
    join setor  s on s.id = t.setor_id
    where v.ciclo_id = ${cicloId}
    order by s.ordem, t.ordem
  `);

  return linhas.map((l) => ({
    tarefaId: Number(l.tarefa_id),
    descricao: l.descricao,
    setor: l.setor,
    periodicidade: l.periodicidade,
    prazoAncora: l.prazo_ancora,
    peso: Number(l.peso_criticidade),
    nivel1: l.nivel_1,
    nivel2: l.nivel_2,
    nivel3: l.nivel_3,
    nivel4: l.nivel_4,
    avaliados: l.avaliados,
    elegiveis: l.elegiveis,
  }));
}
