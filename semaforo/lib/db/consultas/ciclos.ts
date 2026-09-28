import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { ciclo } from '@/lib/db/schema';

export async function ciclosDoDepartamento(departamentoId: number) {
  return db
    .select()
    .from(ciclo)
    .where(eq(ciclo.departamentoId, departamentoId))
    .orderBy(desc(ciclo.referencia));
}

export async function cicloPorId(id: number) {
  const [c] = await db.select().from(ciclo).where(eq(ciclo.id, id)).limit(1);
  return c ?? null;
}

/** O ciclo anterior a este, para as comparações do painel. */
export async function cicloAnterior(atual: { departamentoId: number; referencia: string }) {
  const anteriores = await db
    .select()
    .from(ciclo)
    .where(eq(ciclo.departamentoId, atual.departamentoId))
    .orderBy(desc(ciclo.referencia));
  return anteriores.find((c) => c.referencia < atual.referencia) ?? null;
}
