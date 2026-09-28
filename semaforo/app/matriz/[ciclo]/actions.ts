'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { ciclo, nivel } from '@/lib/db/schema';
import { usuarioAtual } from '@/lib/auth/sessao';
import { podeEditarMatriz } from '@/lib/auth/permissoes';
import { ehNivelValido } from '@/lib/dominio/constantes';

export type ResultadoGravacao =
  | { ok: true; gravadoEm: string }
  | { ok: false; erro: string };

/**
 * Grava o nível de uma pessoa numa tarefa.
 *
 * A validação acontece três vezes, de propósito e em camadas diferentes:
 *  - a interface só oferece os cinco estados válidos;
 *  - `ehNivelValido` recusa o que chegar por outro caminho;
 *  - o CHECK do banco é a última palavra e não depende de nenhum código.
 *
 * As duas primeiras são conveniência. A terceira é a garantia.
 */
export async function gravarNivel(
  cicloId: number,
  tarefaId: number,
  colaboradorId: number,
  valor: number,
): Promise<ResultadoGravacao> {
  try {
    const u = await usuarioAtual();

    const [c] = await db.select().from(ciclo).where(eq(ciclo.id, cicloId)).limit(1);
    if (!c) return { ok: false, erro: 'Ciclo não encontrado.' };

    if (!podeEditarMatriz(u, c)) {
      return {
        ok: false,
        erro:
          c.status === 'fechado'
            ? 'Este ciclo está fechado. Ciclo fechado é imutável, inclusive para o gestor.'
            : 'Você não tem permissão para editar esta matriz.',
      };
    }

    if (!ehNivelValido(valor)) {
      return { ok: false, erro: `Nível inválido: ${valor}. Os valores possíveis são 0 a 4.` };
    }

    const agora = new Date();
    const atualizadas = await db
      .update(nivel)
      .set({
        valor,
        // gravar é avaliar: a partir daqui o zero desta célula é um zero de
        // verdade, e não "ninguém preencheu"
        avaliado: true,
        origem: 'gestor',
        atualizadoPor: u.id,
        atualizadoEm: agora,
      })
      .where(
        and(
          eq(nivel.cicloId, cicloId),
          eq(nivel.tarefaId, tarefaId),
          eq(nivel.colaboradorId, colaboradorId),
        ),
      )
      .returning({ tarefaId: nivel.tarefaId });

    if (atualizadas.length === 0) {
      return { ok: false, erro: 'Célula não existe neste ciclo.' };
    }

    revalidatePath(`/painel/${cicloId}`);
    return { ok: true, gravadoEm: agora.toISOString() };
  } catch (e) {
    console.error('gravarNivel', e);
    return { ok: false, erro: 'Não foi possível gravar. Tente de novo.' };
  }
}
