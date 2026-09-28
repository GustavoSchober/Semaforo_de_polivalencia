/**
 * Seed do catálogo — etapa 1, item 4 da ordem de construção.
 *
 * Idempotente de propósito: você vai rodar isto umas vinte vezes.
 */
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { departamento, setor, tarefa } from '@/lib/db/schema';
import { CATALOGO, TOTAL_TAREFAS } from '@/lib/db/catalogo';

const NOME_DEPARTAMENTO = 'Fiscal / Faturamento / Financeiro';

async function main() {
  console.log('Seed do catálogo inicial\n');

  const [dep] = await db
    .insert(departamento)
    .values({ nome: NOME_DEPARTAMENTO })
    .onConflictDoUpdate({
      target: departamento.nome,
      set: { nome: NOME_DEPARTAMENTO },
    })
    .returning();

  console.log(`departamento  ${dep.nome}  (id ${dep.id})`);

  let setoresNovos = 0;
  let tarefasNovas = 0;

  for (const s of CATALOGO) {
    const [reg] = await db
      .insert(setor)
      .values({ departamentoId: dep.id, nome: s.nome, ordem: s.ordem })
      .onConflictDoUpdate({
        target: [setor.departamentoId, setor.nome],
        set: { ordem: s.ordem },
      })
      .returning();
    setoresNovos += 1;

    for (const [i, t] of s.tarefas.entries()) {
      // sem chave natural única no schema, a idempotência se apoia na busca
      // por (setor, descrição) entre as tarefas vigentes
      const existente = await db
        .select({ id: tarefa.id })
        .from(tarefa)
        .where(and(eq(tarefa.setorId, reg.id), eq(tarefa.descricao, t.descricao)))
        .limit(1);

      const valores = {
        setorId: reg.id,
        descricao: t.descricao,
        periodicidade: t.periodicidade,
        prazoAncora: t.prazoAncora ?? null,
        pesoCriticidade: (t.peso ?? 1).toFixed(1),
        ordem: i + 1,
      };

      if (existente.length > 0) {
        await db.update(tarefa).set(valores).where(eq(tarefa.id, existente[0].id));
      } else {
        await db.insert(tarefa).values(valores);
        tarefasNovas += 1;
      }
    }

    console.log(`  setor  ${s.nome.padEnd(24)} ${s.tarefas.length} tarefas`);
  }

  console.log(
    `\n${setoresNovos} setores, ${TOTAL_TAREFAS} tarefas no catálogo ` +
      `(${tarefasNovas} inseridas agora, o restante já existia).`,
  );
  process.exit(0);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
