/**
 * Quem cobre o quê — funções puras.
 *
 * Moram aqui, e não junto da consulta, porque o cliente precisa delas para
 * recalcular a lista enquanto o usuário marca gente como ausente no simulador.
 * Importar a consulta arrastaria o driver do Postgres para o bundle do
 * navegador; `lib/dominio/` não importa nada, e é essa a razão da regra.
 */

export type PessoaEmTarefa = {
  colaboradorId: number;
  nome: string;
  valor: number;
  avaliado: boolean;
  /** o nível veio da virada do mês e ainda não foi confirmado neste ciclo */
  herdado: boolean;
};

/** Quem atinge o nível pedido, já na ordem em que a consulta entregou. */
export function quemAlcanca(pessoas: PessoaEmTarefa[] | undefined, nivel: number) {
  return (pessoas ?? []).filter((p) => p.avaliado && p.valor >= nivel);
}

/**
 * Quem sobra numa tarefa quando um conjunto de pessoas não está.
 * É a pergunta do simulador, respondida com nome e não com número.
 */
export function quemRestaria(
  pessoas: PessoaEmTarefa[] | undefined,
  nivel: number,
  ausentes: number[],
) {
  const fora = new Set(ausentes);
  return quemAlcanca(pessoas, nivel).filter((p) => !fora.has(p.colaboradorId));
}
