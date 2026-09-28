import { META_POR_TAREFA, NIVEIS_CONTADOS } from './constantes';

export type SemaforoTarefa = {
  nivel_1: number;
  nivel_2: number;
  nivel_3: number;
  nivel_4: number;
};

/**
 * Numerador da cobertura de uma tarefa: soma dos quatro níveis, cada um travado
 * na meta de 3.
 *
 * O `least(n, 3)` é a opção A da seção 7.1 da arquitetura — decisão de negócio,
 * não técnica: a cobertura nunca passa de 100%, e o excedente não conta.
 * Preserva a coerência com o verde do semáforo, que também usa 3.
 */
export function pontosDaTarefa(s: SemaforoTarefa): number {
  return (
    Math.min(s.nivel_1, META_POR_TAREFA) +
    Math.min(s.nivel_2, META_POR_TAREFA) +
    Math.min(s.nivel_3, META_POR_TAREFA) +
    Math.min(s.nivel_4, META_POR_TAREFA)
  );
}

/** Pontos-meta de um conjunto de tarefas: tarefas × 4 níveis × meta de 3. */
export function pontosMeta(qtdTarefas: number): number {
  return qtdTarefas * NIVEIS_CONTADOS * META_POR_TAREFA;
}

/**
 * Cobertura de um conjunto de tarefas, entre 0 e 1.
 *
 * O denominador sai de `count(*)` sobre as tarefas reais — nunca de um número
 * digitado à mão. É o que elimina as inconsistências 1, 2 e 3 da planilha, em
 * que os divisores (120*3), (56*3) e 280 desatualizavam em silêncio.
 * Conjunto vazio devolve null, e não uma divisão por zero disfarçada de 0%.
 */
export function cobertura(tarefas: SemaforoTarefa[]): number | null {
  if (tarefas.length === 0) return null;
  const obtidos = tarefas.reduce((soma, t) => soma + pontosDaTarefa(t), 0);
  return obtidos / pontosMeta(tarefas.length);
}
