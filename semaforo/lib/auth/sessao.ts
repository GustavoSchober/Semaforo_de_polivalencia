import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { colaborador, departamento } from '@/lib/db/schema';
import type { Usuario } from './permissoes';

/**
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  ATENÇÃO — AUTENTICAÇÃO AINDA NÃO IMPLEMENTADA                         │
 * │                                                                        │
 * │  Este módulo devolve um usuário fixo. NÃO HÁ LOGIN: qualquer pessoa    │
 * │  que alcance o servidor escreve na matriz como se fosse o gestor.      │
 * │                                                                        │
 * │  Isso é aceitável enquanto a aplicação roda em localhost durante o     │
 * │  desenvolvimento, e é INACEITÁVEL em qualquer máquina que outra        │
 * │  pessoa alcance — os dados aqui são avaliação de desempenho usada      │
 * │  para promoção e desligamento.                                         │
 * │                                                                        │
 * │  O ADR-005 define o caminho: Auth.js com provider Credentials, ou      │
 * │  LDAP se houver AD local. É a etapa 4, item 2 da ordem de construção.  │
 * │                                                                        │
 * │  A barreira abaixo existe para que este arquivo não chegue a produção  │
 * │  por esquecimento.                                                     │
 * └────────────────────────────────────────────────────────────────────────┘
 */

const AUTENTICACAO_IMPLEMENTADA = false;

export async function usuarioAtual(): Promise<Usuario> {
  if (process.env.NODE_ENV === 'production' && !AUTENTICACAO_IMPLEMENTADA) {
    throw new Error(
      'Autenticação não implementada (ADR-005). Recuse-se a servir esta ' +
        'aplicação fora de localhost até que lib/auth/sessao.ts use um ' +
        'provedor de identidade de verdade.',
    );
  }

  const [dep] = await db.select().from(departamento).limit(1);
  if (!dep) throw new Error('nenhum departamento — rode `npm run db:seed`');

  // enquanto não há login, assume o primeiro gestor do departamento
  const [gestor] = await db
    .select()
    .from(colaborador)
    .where(and(eq(colaborador.departamentoId, dep.id), eq(colaborador.papel, 'gestor')))
    .limit(1);

  if (!gestor) {
    throw new Error(
      'nenhum colaborador com papel de gestor — rode `npm run db:seed-dev`',
    );
  }

  return {
    id: gestor.id,
    nome: gestor.nome,
    papel: gestor.papel,
    departamentoId: gestor.departamentoId,
  };
}

/** Verdadeiro enquanto a aplicação roda sem login de verdade. */
export const semAutenticacao = !AUTENTICACAO_IMPLEMENTADA;
