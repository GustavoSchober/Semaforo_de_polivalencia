import { META_POR_TAREFA } from './constantes';

/**
 * Criticidade ponderada.
 *
 * ATENÇÃO — esta fórmula é proposta da arquitetura (seção 5.6), NÃO está na
 * documentação funcional e ainda não foi validada com o gestor. Enquanto não
 * for validada, use-a apenas para ORDENAR a lista de ação, nunca como
 * indicador publicado.
 *
 * Pondera pelos níveis 3 (opera sozinho) e 4 (ensina), que a seção 3.4 da
 * documentação funcional identifica como o par que realmente mede risco, e
 * multiplica pelo peso da tarefa para que obrigação com prazo legal suba na
 * lista.
 */
export function criticidade(
  semaforo: { nivel_3: number; nivel_4: number },
  peso = 1,
): number {
  const lacuna3 = META_POR_TAREFA - Math.min(semaforo.nivel_3, META_POR_TAREFA);
  const lacuna4 = META_POR_TAREFA - Math.min(semaforo.nivel_4, META_POR_TAREFA);
  return (lacuna3 + lacuna4) * peso;
}
