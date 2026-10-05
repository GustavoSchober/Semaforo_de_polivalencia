/**
 * Testes da regra de desligamento — migration 0004.
 *
 * Duas afirmações do produto, as duas verificáveis só contra o banco:
 *
 *   1. desligar faz a pessoa sumir JÁ do ciclo do mês da saída, e os meses
 *      anteriores continuam dizendo o que era verdade neles;
 *   2. passados três meses, a pessoa é apagada de verdade — e não só escondida.
 *
 * A segunda é a única escrita destrutiva do sistema. Se alguém ampliar o
 * alcance do `delete` por acidente, é aqui que aparece.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { ciclo, colaborador, departamento, nivel, setor, tarefa } from '@/lib/db/schema';

const NOME = `__teste_desligamento_${process.pid}`;

let depId: number;
let setorId: number;
let tarefaId: number;
let cicloJan: number;
let cicloFev: number;
const pessoaIds: Record<string, number> = {};

async function semaforo(cicloId: number) {
  const [l] = await db.execute<{ nivel_4: number; elegiveis: number }>(sql`
    select nivel_4, elegiveis from v_semaforo
    where ciclo_id = ${cicloId} and tarefa_id = ${tarefaId}
  `);
  return l ?? { nivel_4: 0, elegiveis: 0 };
}

beforeAll(async () => {
  const [dep] = await db.insert(departamento).values({ nome: NOME }).returning();
  depId = dep.id;

  const [st] = await db
    .insert(setor)
    .values({ departamentoId: depId, nome: 'Setor único', ordem: 1 })
    .returning();
  setorId = st.id;

  const [t] = await db
    .insert(tarefa)
    .values({ setorId, descricao: 'T1', periodicidade: 'mensal', ordem: 1 })
    .returning();
  tarefaId = t.id;

  for (const nome of ['Ana', 'Bruno']) {
    const [p] = await db
      .insert(colaborador)
      .values({ departamentoId: depId, nome: `${nome} ${NOME}` })
      .returning();
    pessoaIds[nome] = p.id;
  }

  const [jan] = await db
    .insert(ciclo)
    .values({ departamentoId: depId, referencia: '2026-01-01', status: 'fechado', fechadoEm: new Date() })
    .returning();
  cicloJan = jan.id;

  const [fev] = await db
    .insert(ciclo)
    .values({ departamentoId: depId, referencia: '2026-02-01' })
    .returning();
  cicloFev = fev.id;

  await db.insert(nivel).values(
    [cicloJan, cicloFev].flatMap((cicloId) =>
      Object.values(pessoaIds).map((colaboradorId) => ({
        cicloId,
        tarefaId,
        colaboradorId,
        valor: 4,
        avaliado: true,
      })),
    ),
  );
});

afterAll(async () => {
  for (const c of [cicloJan, cicloFev]) {
    await db.delete(nivel).where(eq(nivel.cicloId, c));
    await db.delete(ciclo).where(eq(ciclo.id, c));
  }
  await db.delete(tarefa).where(eq(tarefa.id, tarefaId));
  await db.delete(setor).where(eq(setor.id, setorId));
  await db.delete(colaborador).where(eq(colaborador.departamentoId, depId));
  await db.delete(departamento).where(eq(departamento.id, depId));
});

describe('v_nivel_vigente: o mês da saída já não conta', () => {
  test('com todo mundo dentro, os dois ciclos contam duas pessoas', async () => {
    expect(await semaforo(cicloJan)).toMatchObject({ nivel_4: 2, elegiveis: 2 });
    expect(await semaforo(cicloFev)).toMatchObject({ nivel_4: 2, elegiveis: 2 });
  });

  test('sair em fevereiro tira a pessoa de fevereiro e preserva janeiro', async () => {
    await db
      .update(colaborador)
      .set({ saidaEm: '2026-02-15' })
      .where(eq(colaborador.id, pessoaIds.Bruno));

    expect(await semaforo(cicloJan)).toMatchObject({ nivel_4: 2, elegiveis: 2 });
    expect(await semaforo(cicloFev)).toMatchObject({ nivel_4: 1, elegiveis: 1 });
  });

  test('readmitir devolve a pessoa aos indicadores', async () => {
    await db
      .update(colaborador)
      .set({ saidaEm: null })
      .where(eq(colaborador.id, pessoaIds.Bruno));

    expect(await semaforo(cicloFev)).toMatchObject({ nivel_4: 2, elegiveis: 2 });
  });
});

describe('f_expurgar_desligados', () => {
  async function expurgar(meses: number) {
    return db.execute<{ id: string }>(
      sql`select id from f_expurgar_desligados(${depId}, ${meses})`,
    );
  }

  async function existe(id: number) {
    const [l] = await db.execute<{ n: number }>(
      sql`select count(*)::int as n from colaborador where id = ${id}`,
    );
    return l.n === 1;
  }

  test('dentro do prazo de retenção, não apaga nada', async () => {
    await db
      .update(colaborador)
      .set({ saidaEm: sql`current_date - 10` })
      .where(eq(colaborador.id, pessoaIds.Bruno));

    expect(await expurgar(3)).toHaveLength(0);
    expect(await existe(pessoaIds.Bruno)).toBe(true);
  });

  test('passado o prazo, apaga a pessoa e os níveis dela', async () => {
    await db
      .update(colaborador)
      .set({ saidaEm: sql`current_date - 200` })
      .where(eq(colaborador.id, pessoaIds.Bruno));

    const apagados = await expurgar(3);
    expect(apagados.map((a) => Number(a.id))).toEqual([pessoaIds.Bruno]);
    expect(await existe(pessoaIds.Bruno)).toBe(false);

    const [l] = await db.execute<{ n: number }>(
      sql`select count(*)::int as n from nivel where colaborador_id = ${pessoaIds.Bruno}`,
    );
    expect(l.n).toBe(0);
  });

  test('quem está no departamento não é tocado', async () => {
    expect(await existe(pessoaIds.Ana)).toBe(true);
    expect(await semaforo(cicloFev)).toMatchObject({ nivel_4: 1, elegiveis: 1 });
  });
});
