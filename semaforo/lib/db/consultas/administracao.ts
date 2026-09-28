import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

/**
 * As consultas que alimentam as telas de cadastro.
 *
 * Nenhuma delas guarda contagem: "quantas tarefas essa pessoa domina" sai de
 * `v_nivel_vigente` na hora da leitura, como tudo o mais. Foi essa disciplina
 * que fez o desligamento de uma pessoa repercutir em todas as telas sem que
 * nada precisasse ser atualizado à mão.
 */

export type ColaboradorAdmin = {
  id: number;
  nome: string;
  email: string | null;
  papel: 'colaborador' | 'gestor' | 'diretoria';
  entradaEm: string | null;
  saidaEm: string | null;
  ativo: boolean;
  /** medidos no ciclo aberto; zero quando a pessoa já saiu */
  executaSozinho: number;
  ensina: number;
  pendentes: number;
};

export async function colaboradoresDoDepartamento(
  departamentoId: number,
  cicloId: number | null,
): Promise<ColaboradorAdmin[]> {
  const linhas = await db.execute<{
    id: string;
    nome: string;
    email: string | null;
    papel: ColaboradorAdmin['papel'];
    entrada_em: string | null;
    saida_em: string | null;
    executa_sozinho: number;
    ensina: number;
    pendentes: number;
  }>(sql`
    select
      c.id, c.nome, c.email, c.papel,
      c.entrada_em::text, c.saida_em::text,
      coalesce(count(*) filter (where n.avaliado and n.valor >= 3), 0)::int as executa_sozinho,
      coalesce(count(*) filter (where n.avaliado and n.valor  = 4), 0)::int as ensina,
      coalesce(count(*) filter (where not n.avaliado), 0)::int             as pendentes
    from colaborador c
    left join v_nivel_vigente n
      on n.colaborador_id = c.id
     and n.ciclo_id = ${cicloId}
    where c.departamento_id = ${departamentoId}
    group by c.id, c.nome, c.email, c.papel, c.entrada_em, c.saida_em
    order by (c.saida_em is not null), c.nome
  `);

  return linhas.map((l) => ({
    id: Number(l.id),
    nome: l.nome,
    email: l.email,
    papel: l.papel,
    entradaEm: l.entrada_em,
    saidaEm: l.saida_em,
    ativo: l.saida_em === null,
    executaSozinho: l.executa_sozinho,
    ensina: l.ensina,
    pendentes: l.pendentes,
  }));
}

export type SetorAdmin = { id: number; nome: string; ordem: number; tarefas: number };

export async function setoresDoDepartamento(
  departamentoId: number,
): Promise<SetorAdmin[]> {
  const linhas = await db.execute<{
    id: string;
    nome: string;
    ordem: number;
    tarefas: number;
  }>(sql`
    select s.id, s.nome, s.ordem,
           count(t.id) filter (where t.ativa_ate is null)::int as tarefas
    from setor s
    left join tarefa t on t.setor_id = s.id
    where s.departamento_id = ${departamentoId}
    group by s.id, s.nome, s.ordem
    order by s.ordem, s.nome
  `);
  return linhas.map((l) => ({
    id: Number(l.id),
    nome: l.nome,
    ordem: l.ordem,
    tarefas: l.tarefas,
  }));
}

export type TarefaAdmin = {
  id: number;
  descricao: string;
  setorId: number;
  setor: string;
  periodicidade: string;
  prazoAncora: string | null;
  peso: number;
  ordem: number;
  ativaAte: string | null;
  ativa: boolean;
  /** derivados do ciclo aberto */
  executam: number;
  ensinam: number;
};

export async function tarefasDoDepartamento(
  departamentoId: number,
  cicloId: number | null,
): Promise<TarefaAdmin[]> {
  const linhas = await db.execute<{
    id: string;
    descricao: string;
    setor_id: string;
    setor: string;
    periodicidade: string;
    prazo_ancora: string | null;
    peso_criticidade: string;
    ordem: number;
    ativa_ate: string | null;
    executam: number;
    ensinam: number;
  }>(sql`
    select
      t.id, t.descricao, t.setor_id, s.nome as setor,
      t.periodicidade, t.prazo_ancora, t.peso_criticidade, t.ordem,
      t.ativa_ate::text,
      coalesce(count(*) filter (where n.avaliado and n.valor >= 3), 0)::int as executam,
      coalesce(count(*) filter (where n.avaliado and n.valor  = 4), 0)::int as ensinam
    from tarefa t
    join setor s on s.id = t.setor_id
    left join v_nivel_vigente n on n.tarefa_id = t.id and n.ciclo_id = ${cicloId}
    where s.departamento_id = ${departamentoId}
    group by t.id, t.descricao, t.setor_id, s.nome, t.periodicidade,
             t.prazo_ancora, t.peso_criticidade, t.ordem, t.ativa_ate, s.ordem
    order by (t.ativa_ate is not null), s.ordem, t.ordem, t.id
  `);

  return linhas.map((l) => ({
    id: Number(l.id),
    descricao: l.descricao,
    setorId: Number(l.setor_id),
    setor: l.setor,
    periodicidade: l.periodicidade,
    prazoAncora: l.prazo_ancora,
    peso: Number(l.peso_criticidade),
    ordem: l.ordem,
    ativaAte: l.ativa_ate,
    ativa: l.ativa_ate === null,
    executam: l.executam,
    ensinam: l.ensinam,
  }));
}

export async function tarefaPorId(tarefaId: number) {
  const [l] = await db.execute<{
    id: string;
    descricao: string;
    setor_id: string;
    setor: string;
    periodicidade: string;
    prazo_ancora: string | null;
    peso_criticidade: string;
    ativa_ate: string | null;
    departamento_id: string;
  }>(sql`
    select t.id, t.descricao, t.setor_id, s.nome as setor, t.periodicidade,
           t.prazo_ancora, t.peso_criticidade, t.ativa_ate::text,
           s.departamento_id
    from tarefa t join setor s on s.id = t.setor_id
    where t.id = ${tarefaId}
  `);
  if (!l) return null;
  return {
    id: Number(l.id),
    descricao: l.descricao,
    setorId: Number(l.setor_id),
    setor: l.setor,
    periodicidade: l.periodicidade,
    prazoAncora: l.prazo_ancora,
    peso: Number(l.peso_criticidade),
    ativaAte: l.ativa_ate,
    ativa: l.ativa_ate === null,
    departamentoId: Number(l.departamento_id),
  };
}
