"use server";

import { simular, type Cenario } from "@/lib/db/consultas/simulacao";

/**
 * Recalcula o semáforo removendo um conjunto de pessoas.
 *
 * Existe para que a simulação aconteça sem recarregar a página: é o que deixa
 * as palhetas virarem na tela em vez de aparecerem já viradas. A onda correndo
 * o painel é a leitura — ver 12 tarefas caírem de uma vez diz mais do que ler
 * "12" num indicador.
 *
 * Não escreve nada. `simular` já descarta qualquer coisa que não seja inteiro
 * positivo antes de chegar ao SQL.
 */
export async function simularAusencia(
  cicloId: number,
  ausentes: number[],
): Promise<Cenario> {
  if (!Number.isInteger(cicloId) || cicloId <= 0) {
    throw new Error("ciclo inválido");
  }
  return simular(cicloId, Array.isArray(ausentes) ? ausentes : []);
}
