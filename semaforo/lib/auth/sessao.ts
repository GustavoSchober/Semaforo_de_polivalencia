import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { colaborador, departamento } from '@/lib/db/schema';
import type { Usuario } from './permissoes';
import { cookies } from 'next/headers';
import { COOKIE_ACESSO, sessaoValida } from './acesso';

/**
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  ACESSO POR SENHA ÚNICA — LOGIN INDIVIDUAL AINDA NÃO IMPLEMENTADO      │
 * │                                                                        │
 * │  O app inteiro fica atrás de uma senha compartilhada (proxy.ts e       │
 * │  lib/auth/acesso.ts; a senha é cadastrada e trocada por SQL). Quem     │
 * │  entra opera como o primeiro gestor do departamento: ainda não há      │
 * │  separação entre gestor e colaborador — decisão consciente enquanto a  │
 * │  empresa não tem infraestrutura de identidade.                         │
 * │                                                                        │
 * │  O ADR-005 define o caminho para o login individual: Auth.js com       │
 * │  provider Credentials, ou LDAP se houver AD local.                     │
 * │                                                                        │
 * │  A barreira abaixo repete a do proxy, de propósito: nenhuma leitura    │
 * │  de usuário — e portanto nenhuma escrita — acontece sem sessão válida, │
 * │  mesmo que algum caminho escape do matcher do proxy.                   │
 * └────────────────────────────────────────────────────────────────────────┘
 */

export async function usuarioAtual(): Promise<Usuario> {
  if (!(await sessaoValida((await cookies()).get(COOKIE_ACESSO)?.value))) {
    throw new Error('Sem sessão de acesso válida. Entre com a senha do app.');
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

/** Verdadeiro enquanto todos entram pela mesma senha, sem login por pessoa. */
export const semLoginIndividual = true;
