/**
 * As regras de permissão, em um lugar só (ADR-006).
 *
 * Escritas em TypeScript e não como política SQL porque estas regras não são do
 * tipo "cada um vê só as próprias linhas", que é onde RLS brilha. São regras de
 * fluxo com papéis, e em TypeScript elas cabem em funções de dez linhas com
 * nome, testáveis unitariamente, que aparecem no diff quando mudam.
 *
 * Toda Server Action de escrita chama uma destas. Nenhuma delas toca no banco.
 */

export type Papel = 'colaborador' | 'gestor' | 'diretoria';

export type Usuario = {
  id: number;
  nome: string;
  papel: Papel;
  departamentoId: number;
};

export type CicloParaPermissao = {
  id: number;
  departamentoId: number;
  status: 'aberto' | 'fechado';
};

/**
 * Só o gestor altera a matriz, e só no próprio departamento, e só em ciclo
 * aberto.
 *
 * Ciclo fechado é imutável para TODO MUNDO, inclusive para o gestor. Se ele
 * precisar corrigir, tem que reabrir — e a reabertura fica registrada. É o
 * equivalente honesto de "a aba antiga é congelada".
 */
export function podeEditarMatriz(u: Usuario, ciclo: CicloParaPermissao): boolean {
  return (
    u.papel === 'gestor' &&
    u.departamentoId === ciclo.departamentoId &&
    ciclo.status === 'aberto'
  );
}

/**
 * A matriz é aberta à equipe — objetivo 5, regra 10 da documentação funcional.
 * Isso é deliberado: gera incentivo para alcançar o score do colega e mostra a
 * quem pedir ajuda.
 *
 * A diretoria vê todos os departamentos; os demais, só o próprio.
 */
export function podeVerDepartamento(u: Usuario, departamentoId: number): boolean {
  if (u.papel === 'diretoria') return true;
  return u.departamentoId === departamentoId;
}

/** O colaborador declara apenas a própria autoavaliação, e só em ciclo aberto. */
export function podeEnviarAutoavaliacao(
  u: Usuario,
  ciclo: CicloParaPermissao,
  colaboradorId: number,
): boolean {
  if (u.papel === 'diretoria') return false;
  return (
    u.id === colaboradorId &&
    u.departamentoId === ciclo.departamentoId &&
    ciclo.status === 'aberto'
  );
}

export function podeAprovarAutoavaliacao(u: Usuario, ciclo: CicloParaPermissao): boolean {
  return podeEditarMatriz(u, ciclo);
}

/** Cadastrar tarefa, setor e pessoa; abrir e fechar ciclo. */
export function podeAdministrar(u: Usuario, departamentoId: number): boolean {
  return u.papel === 'gestor' && u.departamentoId === departamentoId;
}

/** Erro de permissão, para as Server Actions devolverem sem vazar detalhe. */
export class SemPermissao extends Error {
  constructor(acao: string) {
    super(`Sem permissão para ${acao}.`);
    this.name = 'SemPermissao';
  }
}
