/**
 * Constantes do domínio.
 *
 * META_POR_TAREFA = 3 é a meta institucional declarada pelo gestor: toda tarefa
 * deve ser dominada por pelo menos 3 pessoas. É o mesmo número que define o
 * verde do semáforo e o divisor de todos os percentuais de cobertura.
 * Ver documentação funcional, seção 6, regra 6.
 */
export const META_POR_TAREFA = 3;

/** Escala de domínio: 0 (não sabe) a 4 (faz e ensina). */
export const NIVEL_MIN = 0;
export const NIVEL_MAX = 4;

/** Quantidade de níveis contados no denominador da cobertura (1 a 4). */
export const NIVEIS_CONTADOS = 4;

export const ROTULO_NIVEL = {
  0: 'Não executa',
  1: 'Aprendendo',
  2: 'Consegue fazer com ajuda',
  3: 'Consegue fazer sem ajuda',
  4: 'Consegue fazer e ensinar',
} as const;

export type Nivel = 0 | 1 | 2 | 3 | 4;

export function ehNivelValido(v: number): v is Nivel {
  return Number.isInteger(v) && v >= NIVEL_MIN && v <= NIVEL_MAX;
}

/**
 * Por quantos meses o quadro de quem saiu continua no banco.
 *
 * Depois disso a pessoa é apagada de verdade — níveis, cadastro e a própria
 * possibilidade de readmitir. É o único expurgo do sistema, e existe porque a
 * alternativa é guardar para sempre 64 células por pessoa que não trabalha mais
 * aqui. Três meses é o prazo em que uma readmissão ainda é plausível e em que
 * uma auditoria de desligamento ainda é feita.
 */
export const RETENCAO_DESLIGADO_MESES = 3;
