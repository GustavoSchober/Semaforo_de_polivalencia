/**
 * Dados de DESENVOLVIMENTO — seção 14.3 da arquitetura.
 *
 * ATENÇÃO: os níveis aqui são SINTÉTICOS e plausíveis, não são a matriz real do
 * departamento. Sem ambiente de preview por branch, a defesa contra "testar em
 * produção sem perceber" é ter dados realistas em desenvolvimento — mas eles
 * não servem para a comparação do Marco 1 (seção 11.3), que exige a matriz de
 * verdade, digitada pelo gestor.
 *
 * Os nomes são os que aparecem na documentação funcional apenas para que as
 * telas tenham a aparência certa durante o desenvolvimento.
 */
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { ciclo, colaborador, departamento, nivel, tarefa } from '@/lib/db/schema';

const PESSOAS = [
  { nome: 'Luis', papel: 'colaborador' as const, forca: 0.55 },
  { nome: 'Alexandre', papel: 'gestor' as const, forca: 0.85 },
  { nome: 'Pamella', papel: 'colaborador' as const, forca: 0.8 },
  { nome: 'Maykon', papel: 'colaborador' as const, forca: 0.15 },
  { nome: 'José Junior', papel: 'colaborador' as const, forca: 0.35 },
];

/**
 * Três ciclos terminando no MÊS CORRENTE — relativos ao relógio, nunca datas
 * fixas.
 *
 * Com datas fixas o seed envelhece: quando o calendário passa delas, o mês em
 * andamento fica sem ciclo e o último ciclo do seed vira um mês futuro aberto.
 * É o estado incoerente que apareceu na aplicação — setembro fechado e outubro
 * aberto, com o relógio marcando setembro.
 */
function ultimosTresMeses(): string[] {
  const hoje = new Date();
  return [2, 1, 0].map((atras) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - atras, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
}

const CICLOS = ultimosTresMeses();

/** Gerador determinístico: o mesmo seed produz sempre a mesma matriz. */
function aleatorio(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

async function main() {
  const [dep] = await db.select().from(departamento).limit(1);
  if (!dep) throw new Error('rode `npm run db:seed` antes deste script');

  const tarefas = await db.select({ id: tarefa.id }).from(tarefa);
  if (tarefas.length === 0) throw new Error('catálogo vazio — rode `npm run db:seed`');

  const pessoas = [];
  for (const p of PESSOAS) {
    const existente = await db
      .select()
      .from(colaborador)
      .where(and(eq(colaborador.departamentoId, dep.id), eq(colaborador.nome, p.nome)))
      .limit(1);

    if (existente.length > 0) {
      pessoas.push({ ...existente[0], forca: p.forca });
    } else {
      const [novo] = await db
        .insert(colaborador)
        .values({ departamentoId: dep.id, nome: p.nome, papel: p.papel })
        .returning();
      pessoas.push({ ...novo, forca: p.forca });
    }
  }

  for (const [indice, referencia] of CICLOS.entries()) {
    const ehUltimo = indice === CICLOS.length - 1;

    const existente = await db
      .select()
      .from(ciclo)
      .where(and(eq(ciclo.departamentoId, dep.id), eq(ciclo.referencia, referencia)))
      .limit(1);

    const [c] =
      existente.length > 0
        ? existente
        : await db
            .insert(ciclo)
            .values({
              departamentoId: dep.id,
              referencia,
              // só o último fica aberto; os anteriores são fotografias imutáveis
              status: ehUltimo ? 'aberto' : 'fechado',
              fechadoEm: ehUltimo ? null : new Date(),
            })
            .returning();

    const rnd = aleatorio(1000 + indice);
    const linhas = [];

    for (const t of tarefas) {
      for (const p of pessoas) {
        // a competência cresce devagar de um ciclo para o outro
        const crescimento = indice * 0.06;
        const chance = rnd();
        const escala = p.forca + crescimento;
        let valor = 0;
        if (chance < escala * 0.55) valor = 4;
        else if (chance < escala * 0.78) valor = 3;
        else if (chance < escala * 0.92) valor = 2;
        else if (chance < escala) valor = 1;

        // Maykon é o entrante ainda não avaliado no ciclo aberto: reproduz de
        // propósito o caso da inconsistência 7, para a interface ter o que
        // sinalizar
        const avaliado = !(ehUltimo && p.nome === 'Maykon');

        linhas.push({
          cicloId: c.id,
          tarefaId: t.id,
          colaboradorId: p.id,
          valor: avaliado ? valor : 0,
          avaliado,
          origem: 'gestor' as const,
        });
      }
    }

    await db
      .insert(nivel)
      .values(linhas)
      .onConflictDoUpdate({
        target: [nivel.cicloId, nivel.tarefaId, nivel.colaboradorId],
        set: {
          valor: sql`excluded.valor`,
          avaliado: sql`excluded.avaliado`,
        },
      });

    console.log(`ciclo ${referencia}  ${linhas.length} células  (${ehUltimo ? 'aberto' : 'fechado'})`);
  }

  console.log('\nDados de desenvolvimento prontos. NÃO são a matriz real.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
