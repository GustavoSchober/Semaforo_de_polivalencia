'use server';

import { sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { departamento } from '@/lib/db/schema';
import { usuarioAtual } from '@/lib/auth/sessao';
import { podeAdministrar } from '@/lib/auth/permissoes';
import { garantirCicloDoMes } from '@/lib/db/ciclo-vigente';
import { ehNivelValido } from '@/lib/dominio/constantes';

export type Resultado = { ok: true } | { ok: false; erro: string };

/**
 * As escritas de cadastro.
 *
 * Duas regras atravessam todas elas:
 *
 * 1. NADA É APAGADO. Desligar uma pessoa grava `saida_em`; tirar uma tarefa do
 *    catálogo grava `ativa_ate`. As linhas de `nivel` continuam onde estão, e é
 *    por isso que o ciclo de setembro continua dizendo o que era verdade em
 *    setembro depois de alguém sair em outubro. Quem filtra é a view
 *    `v_nivel_vigente`, num lugar só (ADR-009).
 *
 * 2. CRIAR ABRE AS CÉLULAS. Uma pessoa nova sem linhas em `nivel` não existe
 *    para a matriz; uma tarefa nova sem linhas não aparece para ninguém
 *    preencher. Toda criação abre as células correspondentes no ciclo aberto,
 *    na mesma transação — senão o cadastro fica "feito" e invisível.
 */

type Contexto =
  | { ok: false; erro: string }
  | {
      ok: true;
      u: Awaited<ReturnType<typeof usuarioAtual>>;
      departamentoId: number;
      /** null quando o mês corrente, por algum motivo, não está aberto */
      cicloAberto: number | null;
    };

async function contexto(): Promise<Contexto> {
  const u = await usuarioAtual();
  const [dep] = await db.select().from(departamento).limit(1);
  if (!dep) return { ok: false, erro: 'Nenhum departamento cadastrado.' };
  if (!podeAdministrar(u, dep.id)) {
    return { ok: false, erro: 'Você não tem permissão para administrar este departamento.' };
  }
  const ciclo = await garantirCicloDoMes(dep.id);
  return {
    ok: true,
    u,
    departamentoId: dep.id,
    cicloAberto: ciclo && ciclo.status === 'aberto' ? ciclo.id : null,
  };
}

function revalidarTudo() {
  revalidatePath('/', 'layout');
}

function texto(v: FormDataEntryValue | null, max = 200) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function idValido(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v > 0;
}

/** O setor existe E é deste departamento — um id de outro não passa. */
async function setorDoDepartamento(setorId: number, departamentoId: number) {
  const [s] = await db.execute(sql`
    select 1 from setor where id = ${setorId} and departamento_id = ${departamentoId}
  `);
  return Boolean(s);
}

// ---------------------------------------------------------------- colaborador

export async function criarColaborador(fd: FormData): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx.ok) return { ok: false, erro: ctx.erro };

  const nome = texto(fd.get('nome'), 120);
  if (nome.length < 2) return { ok: false, erro: 'Informe o nome do colaborador.' };

  const emailBruto = texto(fd.get('email'), 200);
  const email = emailBruto === '' ? null : emailBruto;
  const papelBruto = texto(fd.get('papel'), 20);
  const papel = (['colaborador', 'gestor', 'diretoria'] as const).includes(
    papelBruto as never,
  )
    ? papelBruto
    : 'colaborador';

  try {
    await db.transaction(async (tx) => {
      const [novo] = await tx.execute<{ id: string }>(sql`
        insert into colaborador (departamento_id, nome, email, papel, entrada_em)
        values (${ctx.departamentoId}, ${nome}, ${email}, ${papel}::papel, current_date)
        returning id
      `);

      // abre o quadro da pessoa no ciclo aberto, senão ela não existe na matriz
      if (ctx.cicloAberto) {
        await tx.execute(sql`
          insert into nivel (ciclo_id, tarefa_id, colaborador_id, valor, avaliado, origem)
          select ${ctx.cicloAberto}, t.id, ${Number(novo.id)}, 0, false, 'gestor'
          from tarefa t
          join setor s on s.id = t.setor_id and s.departamento_id = ${ctx.departamentoId}
          where t.ativa_ate is null
          on conflict do nothing
        `);
      }
    });
  } catch (e) {
    console.error('criarColaborador', e);
    return { ok: false, erro: 'Não foi possível cadastrar. O e-mail já pode estar em uso.' };
  }

  revalidarTudo();
  return { ok: true };
}

export async function editarColaborador(fd: FormData): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx.ok) return { ok: false, erro: ctx.erro };

  const id = Number(fd.get('id'));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, erro: 'Colaborador inválido.' };

  const nome = texto(fd.get('nome'), 120);
  if (nome.length < 2) return { ok: false, erro: 'Informe o nome do colaborador.' };

  const emailBruto = texto(fd.get('email'), 200);
  const email = emailBruto === '' ? null : emailBruto;
  const papelBruto = texto(fd.get('papel'), 20);
  const papel = (['colaborador', 'gestor', 'diretoria'] as const).includes(
    papelBruto as never,
  )
    ? papelBruto
    : 'colaborador';

  try {
    await db.execute(sql`
      update colaborador
      set nome = ${nome}, email = ${email}, papel = ${papel}::papel
      where id = ${id} and departamento_id = ${ctx.departamentoId}
    `);
  } catch (e) {
    console.error('editarColaborador', e);
    return { ok: false, erro: 'Não foi possível salvar. O e-mail já pode estar em uso.' };
  }

  revalidarTudo();
  return { ok: true };
}

/**
 * Desliga ou readmite.
 *
 * Desligar não apaga: grava a data de saída. A partir dela, `v_nivel_vigente`
 * para de contar a pessoa já no ciclo do MÊS DA SAÍDA — matriz, painel,
 * simulador e evolução perdem a pessoa no mesmo instante, e os meses anteriores
 * continuam dizendo o que era verdade neles. O quadro que ela deixou fica na
 * gaveta de histórico da tela de cadastro por `RETENCAO_DESLIGADO_MESES` meses,
 * e só então é apagado de verdade.
 *
 * Readmitir reabre as células do ciclo em andamento. Sem isso, quem foi
 * readmitido depois de uma virada do mês voltaria sem quadro nenhum: a virada
 * monta o produto cartesiano só de quem estava no departamento naquele dia.
 */
export async function alternarDesligamento(fd: FormData): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx.ok) return { ok: false, erro: ctx.erro };

  const id = Number(fd.get('id'));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, erro: 'Colaborador inválido.' };

  if (id === ctx.u.id) {
    return { ok: false, erro: 'Você não pode desligar a si mesmo enquanto administra o departamento.' };
  }

  const desligar = fd.get('acao') === 'desligar';
  const [alterado] = await db.execute<{ id: string }>(sql`
    update colaborador
    set saida_em = ${desligar ? sql`current_date` : sql`null`}
    where id = ${id} and departamento_id = ${ctx.departamentoId}
    returning id
  `);

  if (!alterado) {
    return {
      ok: false,
      erro: 'Colaborador não encontrado. Ele pode já ter passado do prazo de retenção e sido apagado.',
    };
  }

  if (!desligar && ctx.cicloAberto) {
    await db.execute(sql`
      insert into nivel (ciclo_id, tarefa_id, colaborador_id, valor, avaliado, origem)
      select ${ctx.cicloAberto}, t.id, ${id}, 0, false, 'gestor'
      from tarefa t
      join setor s on s.id = t.setor_id and s.departamento_id = ${ctx.departamentoId}
      where t.ativa_ate is null
      on conflict do nothing
    `);
  }

  revalidarTudo();
  return { ok: true };
}

// --------------------------------------------------------------------- tarefa

export async function criarTarefa(fd: FormData): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx.ok) return { ok: false, erro: ctx.erro };

  const descricao = texto(fd.get('descricao'), 300);
  if (descricao.length < 3) return { ok: false, erro: 'Descreva a tarefa.' };

  const setorId = Number(fd.get('setorId'));
  if (!idValido(setorId) || !(await setorDoDepartamento(setorId, ctx.departamentoId))) {
    return { ok: false, erro: 'Escolha um setor para a tarefa.' };
  }

  const periodicidade = texto(fd.get('periodicidade'), 20) || 'mensal';
  if (!['diaria', 'semanal', 'mensal', 'anual'].includes(periodicidade)) {
    return { ok: false, erro: 'Periodicidade inválida.' };
  }

  const prazoBruto = texto(fd.get('prazoAncora'), 60);
  const prazoAncora = prazoBruto === '' ? null : prazoBruto;

  const peso = Number(fd.get('peso'));
  const pesoValido = Number.isFinite(peso) && peso > 0 && peso <= 9.9 ? peso : 1;

  try {
    await db.transaction(async (tx) => {
      const [nova] = await tx.execute<{ id: string }>(sql`
        insert into tarefa (setor_id, descricao, periodicidade, prazo_ancora,
                            peso_criticidade, ordem)
        select ${setorId}, ${descricao}, ${periodicidade}::periodicidade,
               ${prazoAncora}, ${pesoValido},
               coalesce(max(t.ordem), 0) + 1
        from tarefa t
        where t.setor_id = ${setorId}
        returning id
      `);

      // abre a linha da tarefa para todo mundo que está no departamento
      if (ctx.cicloAberto) {
        await tx.execute(sql`
          insert into nivel (ciclo_id, tarefa_id, colaborador_id, valor, avaliado, origem)
          select ${ctx.cicloAberto}, ${Number(nova.id)}, c.id, 0, false, 'gestor'
          from colaborador c
          where c.departamento_id = ${ctx.departamentoId} and c.saida_em is null
          on conflict do nothing
        `);
      }
    });
  } catch (e) {
    console.error('criarTarefa', e);
    return { ok: false, erro: 'Não foi possível cadastrar a tarefa.' };
  }

  revalidarTudo();
  return { ok: true };
}

export async function editarTarefa(fd: FormData): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx.ok) return { ok: false, erro: ctx.erro };

  const id = Number(fd.get('id'));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, erro: 'Tarefa inválida.' };

  const descricao = texto(fd.get('descricao'), 300);
  if (descricao.length < 3) return { ok: false, erro: 'Descreva a tarefa.' };

  const setorId = Number(fd.get('setorId'));
  if (!idValido(setorId) || !(await setorDoDepartamento(setorId, ctx.departamentoId))) {
    return { ok: false, erro: 'Escolha um setor para a tarefa.' };
  }
  const periodicidade = texto(fd.get('periodicidade'), 20) || 'mensal';
  if (!['diaria', 'semanal', 'mensal', 'anual'].includes(periodicidade)) {
    return { ok: false, erro: 'Periodicidade inválida.' };
  }
  const prazoBruto = texto(fd.get('prazoAncora'), 60);
  const prazoAncora = prazoBruto === '' ? null : prazoBruto;
  const peso = Number(fd.get('peso'));
  const pesoValido = Number.isFinite(peso) && peso > 0 && peso <= 9.9 ? peso : 1;

  try {
    await db.execute(sql`
      update tarefa t
      set descricao = ${descricao},
          setor_id = ${setorId},
          periodicidade = ${periodicidade}::periodicidade,
          prazo_ancora = ${prazoAncora},
          peso_criticidade = ${pesoValido}
      from setor s
      where t.id = ${id} and s.id = t.setor_id
        and s.departamento_id = ${ctx.departamentoId}
    `);
  } catch (e) {
    console.error('editarTarefa', e);
    return { ok: false, erro: 'Não foi possível salvar a tarefa.' };
  }

  revalidarTudo();
  return { ok: true };
}

export async function alternarVigenciaTarefa(fd: FormData): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx.ok) return { ok: false, erro: ctx.erro };

  const id = Number(fd.get('id'));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, erro: 'Tarefa inválida.' };
  const desativar = fd.get('acao') === 'desativar';

  await db.execute(sql`
    update tarefa t
    set ativa_ate = ${desativar ? sql`current_date` : sql`null`}
    from setor s
    where t.id = ${id} and s.id = t.setor_id and s.departamento_id = ${ctx.departamentoId}
  `);

  // reativar uma tarefa depois da virada exige reabrir as células do ciclo
  if (!desativar && ctx.cicloAberto) {
    await db.execute(sql`
      insert into nivel (ciclo_id, tarefa_id, colaborador_id, valor, avaliado, origem)
      select ${ctx.cicloAberto}, ${id}, c.id, 0, false, 'gestor'
      from colaborador c
      where c.departamento_id = ${ctx.departamentoId} and c.saida_em is null
      on conflict do nothing
    `);
  }

  revalidarTudo();
  return { ok: true };
}

// ---------------------------------------------------- nível, pela tela de tarefa

/**
 * O mesmo dado da matriz, editado pela tela da tarefa.
 *
 * Grava em `nivel` — a única fonte de verdade. "Quantas pessoas executam" e
 * "quantas ensinam" continuam derivadas disso, nunca digitadas.
 */
export async function definirNivelNaTarefa(
  tarefaId: number,
  colaboradorId: number,
  valor: number,
): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx.ok) return { ok: false, erro: ctx.erro };
  if (!ctx.cicloAberto) {
    return { ok: false, erro: 'Não há ciclo aberto para receber esta marcação.' };
  }
  // os argumentos chegam do navegador e podem ser qualquer coisa
  if (!idValido(tarefaId) || !idValido(colaboradorId)) {
    return { ok: false, erro: 'Célula inválida.' };
  }
  if (!ehNivelValido(valor)) {
    return { ok: false, erro: 'Nível inválido. Os valores possíveis são 0 a 4.' };
  }

  const linhas = await db.execute<{ tarefa_id: string }>(sql`
    update nivel
    set valor = ${valor}, avaliado = true, origem = 'gestor',
        atualizado_por = ${ctx.u.id}, atualizado_em = now()
    where ciclo_id = ${ctx.cicloAberto}
      and tarefa_id = ${tarefaId}
      and colaborador_id = ${colaboradorId}
    returning tarefa_id
  `);

  if (linhas.length === 0) {
    return { ok: false, erro: 'Esta célula não existe no ciclo aberto.' };
  }

  revalidarTudo();
  return { ok: true };
}

// ---------------------------------------------------------------------- ciclo

/**
 * Fecha o ciclo aberto antes da hora, ou reabre um fechado.
 *
 * A virada normal é automática e acontece sozinha no dia 1º. Isto aqui é a
 * exceção: fechar mais cedo, ou reabrir para corrigir um erro. A reabertura
 * existe porque a alternativa — dado errado congelado para sempre — é pior; ela
 * fica registrada em `fechado_em` voltando a nulo.
 */
export async function alternarCiclo(fd: FormData): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx.ok) return { ok: false, erro: ctx.erro };

  const id = Number(fd.get('id'));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, erro: 'Ciclo inválido.' };
  const fechar = fd.get('acao') === 'fechar';

  await db.execute(sql`
    update ciclo
    set status = ${fechar ? sql`'fechado'::status_ciclo` : sql`'aberto'::status_ciclo`},
        fechado_em = ${fechar ? sql`now()` : sql`null`},
        fechado_por = ${fechar ? ctx.u.id : sql`null`}
    where id = ${id} and departamento_id = ${ctx.departamentoId}
  `);

  revalidarTudo();
  return { ok: true };
}
