/**
 * Testes da camada de cálculo contra um cenário conhecido — seção 13, item 2.
 *
 * Monta um departamento isolado com 3 tarefas e 4 pessoas, cujos resultados
 * foram calculados à mão abaixo, e confere as views. Se alguém mexer no
 * `least(n,3)` sem pensar, estes testes avisam.
 *
 * O cenário inclui de propósito uma pessoa NÃO AVALIADA, porque é a distinção
 * que a planilha não sabe fazer e que este sistema existe para fazer.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { ciclo, colaborador, departamento, nivel, setor, tarefa } from '@/lib/db/schema';

const NOME = `__teste_calculos_${process.pid}`;

/*
 *            T1      T2      T3
 *   Ana      4       2       0        avaliada
 *   Bruno    3       2       0        avaliada
 *   Célia    0       2       0        avaliada
 *   Dinho    4       0       0        NÃO AVALIADA — não pode contar em nada
 *
 *   v_semaforo             n1  n2  n3  n4    avaliados  elegíveis
 *     T1  (Ana4, Bruno3)    2   2   2   1        3          4
 *     T2  (todas em 2)      3   3   0   0        3          4
 *     T3  (ninguém)         0   0   0   0        3          4
 *
 *   cobertura = (2+2+2+1) + (3+3+0+0) + 0  =  13
 *               ────────────────────────────────
 *                   3 tarefas × 4 níveis × 3     =  36      →  13/36
 */
const ESPERADO = {
  t1: { n1: 2, n2: 2, n3: 2, n4: 1, avaliados: 3, elegiveis: 4 },
  t2: { n1: 3, n2: 3, n3: 0, n4: 0, avaliados: 3, elegiveis: 4 },
  t3: { n1: 0, n2: 0, n3: 0, n4: 0, avaliados: 3, elegiveis: 4 },
  cobertura: 13 / 36,
};

let depId: number;
let cicloId: number;
const tarefaIds: number[] = [];
const pessoaIds: Record<string, number> = {};

beforeAll(async () => {
  const [dep] = await db.insert(departamento).values({ nome: NOME }).returning();
  depId = dep.id;

  const [st] = await db
    .insert(setor)
    .values({ departamentoId: depId, nome: 'Setor único', ordem: 1 })
    .returning();

  for (const [i, descricao] of ['T1', 'T2', 'T3'].entries()) {
    const [t] = await db
      .insert(tarefa)
      .values({ setorId: st.id, descricao, periodicidade: 'mensal', ordem: i + 1 })
      .returning();
    tarefaIds.push(t.id);
  }

  for (const nome of ['Ana', 'Bruno', 'Célia', 'Dinho']) {
    const [p] = await db
      .insert(colaborador)
      .values({ departamentoId: depId, nome: `${nome} ${NOME}` })
      .returning();
    pessoaIds[nome] = p.id;
  }

  const [c] = await db
    .insert(ciclo)
    .values({ departamentoId: depId, referencia: '2026-01-01' })
    .returning();
  cicloId = c.id;

  const matriz: Record<string, [number, number, number]> = {
    Ana: [4, 2, 0],
    Bruno: [3, 2, 0],
    Célia: [0, 2, 0],
    Dinho: [4, 0, 0],
  };

  const linhas = [];
  for (const [nome, valores] of Object.entries(matriz)) {
    for (const [i, valor] of valores.entries()) {
      linhas.push({
        cicloId,
        tarefaId: tarefaIds[i],
        colaboradorId: pessoaIds[nome],
        valor,
        avaliado: nome !== 'Dinho',
      });
    }
  }
  await db.insert(nivel).values(linhas);
});

afterAll(async () => {
  // ordem inversa das dependências: on delete restrict recusaria o contrário
  await db.delete(nivel).where(eq(nivel.cicloId, cicloId));
  await db.delete(ciclo).where(eq(ciclo.id, cicloId));
  for (const id of tarefaIds) await db.delete(tarefa).where(eq(tarefa.id, id));
  await db.delete(setor).where(eq(setor.departamentoId, depId));
  await db.delete(colaborador).where(eq(colaborador.departamentoId, depId));
  await db.delete(departamento).where(eq(departamento.id, depId));
});

describe('v_semaforo', () => {
  test('conta quantas pessoas atingiram cada nível, cumulativamente', async () => {
    const linhas = await db.execute<{
      tarefa_id: string;
      nivel_1: number; nivel_2: number; nivel_3: number; nivel_4: number;
      avaliados: number; elegiveis: number;
    }>(sql`
      select tarefa_id, nivel_1, nivel_2, nivel_3, nivel_4, avaliados, elegiveis
      from v_semaforo where ciclo_id = ${cicloId} order by tarefa_id
    `);

    expect(linhas).toHaveLength(3);
    const [t1, t2, t3] = linhas;

    expect({ n1: t1.nivel_1, n2: t1.nivel_2, n3: t1.nivel_3, n4: t1.nivel_4,
             avaliados: t1.avaliados, elegiveis: t1.elegiveis }).toEqual(ESPERADO.t1);
    expect({ n1: t2.nivel_1, n2: t2.nivel_2, n3: t2.nivel_3, n4: t2.nivel_4,
             avaliados: t2.avaliados, elegiveis: t2.elegiveis }).toEqual(ESPERADO.t2);
    expect({ n1: t3.nivel_1, n2: t3.nivel_2, n3: t3.nivel_3, n4: t3.nivel_4,
             avaliados: t3.avaliados, elegiveis: t3.elegiveis }).toEqual(ESPERADO.t3);
  });

  test('quem não foi avaliado não entra na contagem, mesmo com valor 4', async () => {
    // Dinho tem 4 em T1. Se contasse, T1 teria n4 = 2 em vez de 1.
    const [t1] = await db.execute<{ nivel_4: number }>(sql`
      select nivel_4 from v_semaforo
      where ciclo_id = ${cicloId} and tarefa_id = ${tarefaIds[0]}
    `);
    expect(t1.nivel_4).toBe(1);
  });
});

describe('v_cobertura_setor e v_cobertura_departamento', () => {
  test('o denominador é tarefas × 4 níveis × meta de 3', async () => {
    const [linha] = await db.execute<{ tarefas: number; cobertura: string }>(sql`
      select tarefas, cobertura from v_cobertura_setor where ciclo_id = ${cicloId}
    `);
    expect(linha.tarefas).toBe(3);
    expect(Number(linha.cobertura)).toBeCloseTo(ESPERADO.cobertura, 10);
  });

  test('a cobertura do departamento bate com a do setor único', async () => {
    const [linha] = await db.execute<{ cobertura: string }>(sql`
      select cobertura from v_cobertura_departamento where ciclo_id = ${cicloId}
    `);
    expect(Number(linha.cobertura)).toBeCloseTo(ESPERADO.cobertura, 10);
  });

  test('a cobertura nunca passa de 100%, mesmo com todos em nível 4', async () => {
    await db
      .update(nivel)
      .set({ valor: 4, avaliado: true })
      .where(eq(nivel.cicloId, cicloId));

    const [linha] = await db.execute<{ cobertura: string }>(sql`
      select cobertura from v_cobertura_departamento where ciclo_id = ${cicloId}
    `);
    // 4 pessoas em nível 4 renderiam 16 pontos por tarefa sem o least(n,3);
    // com ele, exatamente 12 — a meta, e nada além dela.
    expect(Number(linha.cobertura)).toBe(1);
  });
});

describe('v_pontuacao', () => {
  test('soma os pontos de nível e separa autônomos de quem ensina', async () => {
    // restaura o cenário original, desfeito pelo teste do teto de 100%
    const matriz: Record<string, [number, number, number]> = {
      Ana: [4, 2, 0], Bruno: [3, 2, 0], Célia: [0, 2, 0], Dinho: [4, 0, 0],
    };
    for (const [nome, valores] of Object.entries(matriz)) {
      for (const [i, valor] of valores.entries()) {
        await db
          .update(nivel)
          .set({ valor, avaliado: nome !== 'Dinho' })
          .where(sql`ciclo_id = ${cicloId} and tarefa_id = ${tarefaIds[i]}
                     and colaborador_id = ${pessoaIds[nome]}`);
      }
    }

    const linhas = await db.execute<{
      colaborador_id: string; pontos: number;
      tarefas_autonomas: number; tarefas_que_ensina: number;
    }>(sql`
      select colaborador_id, pontos, tarefas_autonomas, tarefas_que_ensina
      from v_pontuacao where ciclo_id = ${cicloId} order by colaborador_id
    `);

    const por = new Map(linhas.map((l) => [Number(l.colaborador_id), l]));

    expect(por.get(pessoaIds.Ana)).toMatchObject({
      pontos: 6, tarefas_autonomas: 1, tarefas_que_ensina: 1,
    });
    expect(por.get(pessoaIds.Bruno)).toMatchObject({
      pontos: 5, tarefas_autonomas: 1, tarefas_que_ensina: 0,
    });
    expect(por.get(pessoaIds['Célia'])).toMatchObject({
      pontos: 2, tarefas_autonomas: 0, tarefas_que_ensina: 0,
    });
  });

  test('quem não foi avaliado não aparece — não regride para zero', async () => {
    const linhas = await db.execute<{ colaborador_id: string }>(sql`
      select colaborador_id from v_pontuacao where ciclo_id = ${cicloId}
    `);
    const ids = linhas.map((l) => Number(l.colaborador_id));
    expect(ids).not.toContain(pessoaIds.Dinho);
    expect(ids).toHaveLength(3);
  });
});

describe('f_semaforo_simulado', () => {
  test('sem ausentes, reproduz exatamente o semáforo atual', async () => {
    const linhas = await db.execute<{
      tarefa_id: string; nivel_1: number; nivel_4: number;
    }>(sql`
      select tarefa_id, nivel_1, nivel_4
      from f_semaforo_simulado(${cicloId}, ${sql.param([])}::bigint[])
      order by tarefa_id
    `);
    expect(linhas[0].nivel_1).toBe(ESPERADO.t1.n1);
    expect(linhas[0].nivel_4).toBe(ESPERADO.t1.n4);
  });

  test('removendo Ana, T1 perde o único especialista', async () => {
    const linhas = await db.execute<{
      tarefa_id: string; nivel_1: number; nivel_3: number; nivel_4: number;
    }>(sql`
      select tarefa_id, nivel_1, nivel_3, nivel_4
      from f_semaforo_simulado(${cicloId}, ${sql.param([pessoaIds.Ana])}::bigint[])
      order by tarefa_id
    `);
    // T1 fica só com Bruno (nível 3): uma pessoa opera sozinha, nenhuma ensina
    expect(linhas[0]).toMatchObject({ nivel_1: 1, nivel_3: 1, nivel_4: 0 });
  });

  test('aceita várias pessoas ao mesmo tempo — a pergunta das férias', async () => {
    const linhas = await db.execute<{ nivel_1: number }>(sql`
      select nivel_1
      from f_semaforo_simulado(
        ${cicloId}, ${sql.param([pessoaIds.Ana, pessoaIds.Bruno])}::bigint[]
      ) order by tarefa_id
    `);
    // sem Ana e sem Bruno, T1 fica sem ninguém (Célia tem 0, Dinho não conta)
    expect(linhas[0].nivel_1).toBe(0);
  });
});
