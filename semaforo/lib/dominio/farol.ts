/**
 * A regra central de negócio, na letra do sponsor:
 * "se somente 1 pessoa souber fazer os trabalhos daquela linha, o semáforo
 * ficará VERMELHO."
 *
 * Zero e um são ambos vermelhos. Não é engano — é a regra.
 * Ver documentação funcional, seção 3.4.
 */
export type Farol = 'vermelho' | 'amarelo' | 'verde';

export function farol(pessoas: number): Farol {
  if (pessoas < 2) return 'vermelho';
  if (pessoas === 2) return 'amarelo';
  return 'verde';
}

/**
 * Falsa sensação de segurança: a tarefa parece coberta no nível 1, mas ninguém
 * ali é capaz de treinar um substituto. Ver documentação funcional, seção 3.4:
 * "AG verde com AJ vermelho é uma falsa sensação de segurança."
 */
export function falsaSeguranca(s: { nivel_1: number; nivel_4: number }): boolean {
  return farol(s.nivel_1) === 'verde' && farol(s.nivel_4) === 'vermelho';
}
