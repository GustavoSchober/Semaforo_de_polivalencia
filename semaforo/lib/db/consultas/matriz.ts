import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export type PessoaDaMatriz = {
  id: number;
  nome: string;
  papel: string;
  /** Quantas células desta pessoa ainda não foram avaliadas neste ciclo. */
  pendentes: number;
};

export type TarefaDaMatriz = {
  tarefaId: number;
  descricao: string;
  setor: string;
  setorId: number;
  periodicidade: string;
  prazoAncora: string | null;
  /** valor e avaliado por colaboradorId */
  celulas: Record<number, { valor: number; avaliado: boolean }>;
};

/**
 * A matriz inteira de um ciclo: 64 tarefas × 5 pessoas.
 *
 * Duas consultas e uma montagem em memória, em vez de um join que devolveria
 * 320 linhas para a interface remontar. Nesta escala a diferença é irrelevante
 * e a forma do retorno é a forma da tela.
 *
 * Lê de `v_nivel_vigente`, nunca de `nivel` cru. É o que mantém a matriz igual
 * ao painel: quem foi desligado some da grade no mesmo instante em que some dos
 * indicadores, em vez de continuar ocupando uma coluna de zeros.
 */
export async function matrizDoCiclo(cicloId: number): Promise<{
  pessoas: PessoaDaMatriz[];
  tarefas: TarefaDaMatriz[];
}> {
  const pessoasBrutas = await db.execute<{
    id: string;
    nome: string;
    papel: string;
    pendentes: number;
  }>(sql`
    select c.id, c.nome, c.papel,
           count(*) filter (where not n.avaliado)::int as pendentes
    from colaborador c
    join v_nivel_vigente n on n.colaborador_id = c.id and n.ciclo_id = ${cicloId}
    group by c.id, c.nome, c.papel
    order by c.id
  `);

  const celulasBrutas = await db.execute<{
    tarefa_id: string;
    descricao: string;
    setor: string;
    setor_id: string;
    periodicidade: string;
    prazo_ancora: string | null;
    ordem_setor: number;
    ordem_tarefa: number;
    colaborador_id: string;
    valor: number;
    avaliado: boolean;
  }>(sql`
    select t.id as tarefa_id, t.descricao, s.nome as setor, s.id as setor_id,
           t.periodicidade, t.prazo_ancora,
           s.ordem as ordem_setor, t.ordem as ordem_tarefa,
           n.colaborador_id, n.valor, n.avaliado
    from v_nivel_vigente n
    join tarefa t on t.id = n.tarefa_id
    join setor  s on s.id = t.setor_id
    where n.ciclo_id = ${cicloId}
    order by s.ordem, t.ordem, n.colaborador_id
  `);

  const porTarefa = new Map<number, TarefaDaMatriz>();
  for (const c of celulasBrutas) {
    const id = Number(c.tarefa_id);
    let t = porTarefa.get(id);
    if (!t) {
      t = {
        tarefaId: id,
        descricao: c.descricao,
        setor: c.setor,
        setorId: Number(c.setor_id),
        periodicidade: c.periodicidade,
        prazoAncora: c.prazo_ancora,
        celulas: {},
      };
      porTarefa.set(id, t);
    }
    t.celulas[Number(c.colaborador_id)] = { valor: c.valor, avaliado: c.avaliado };
  }

  return {
    pessoas: pessoasBrutas.map((p) => ({
      id: Number(p.id),
      nome: p.nome,
      papel: p.papel,
      pendentes: p.pendentes,
    })),
    tarefas: [...porTarefa.values()],
  };
}
