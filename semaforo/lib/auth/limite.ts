/**
 * Freio contra adivinhação da senha.
 *
 * Por origem: depois de MAX_FALHAS erros em JANELA_MS, aquela origem espera a
 * janela acabar. A origem é o primeiro endereço de `x-forwarded-for`, que a
 * Vercel preenche com o IP de quem acessa. Quem fala direto com o servidor pode
 * forjar esse cabeçalho, então existe também um teto GLOBAL, mais alto, que não
 * depende de cabeçalho nenhum.
 *
 * Fica em memória: reiniciar o contêiner zera os contadores, o que é aceitável
 * para um freio (não é auditoria).
 */

const JANELA_MS = 15 * 60 * 1000;
const MAX_FALHAS_POR_ORIGEM = 5;
const MAX_FALHAS_GLOBAL = 50;

const falhas = new Map<string, number[]>();

function recentes(chave: string, agora: number): number[] {
  const lista = (falhas.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);
  if (lista.length) falhas.set(chave, lista);
  else falhas.delete(chave);
  return lista;
}

/** Minutos até poder tentar de novo, ou 0 se está liberado. */
export function bloqueadoPor(origem: string): number {
  const agora = Date.now();
  for (const [chave, max] of [
    [`o:${origem}`, MAX_FALHAS_POR_ORIGEM],
    ['global', MAX_FALHAS_GLOBAL],
  ] as const) {
    const lista = recentes(chave, agora);
    if (lista.length >= max) {
      return Math.max(1, Math.ceil((lista[0] + JANELA_MS - agora) / 60_000));
    }
  }
  return 0;
}

export function registrarFalha(origem: string): void {
  const agora = Date.now();
  for (const chave of [`o:${origem}`, 'global']) {
    falhas.set(chave, [...recentes(chave, agora), agora]);
  }
}

export function limparFalhas(origem: string): void {
  falhas.delete(`o:${origem}`);
}
