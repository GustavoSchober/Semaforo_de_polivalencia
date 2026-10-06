import { createHmac, timingSafeEqual } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

/**
 * A senha única do app (migration 0005).
 *
 * A senha é conferida pelo próprio Postgres (`crypt`, bcrypt) e nunca sai do
 * banco. O cookie de sessão carrega um HMAC do hash atual da senha, com o
 * segredo de sessão guardado na mesma linha — então trocar a senha por SQL
 * invalida na hora todo cookie emitido antes, sem tabela de sessões.
 */

export const COOKIE_ACESSO = 'semaforo_acesso';
export const VALIDADE_SESSAO_SEGUNDOS = 60 * 60 * 24 * 30;

type Linha = { senha_hash: string; segredo_sessao: string };

async function linhaDeAcesso(): Promise<Linha | null> {
  const linhas = await db.execute<Linha>(
    sql`select senha_hash, segredo_sessao from acesso where id = 1`,
  );
  return linhas[0] ?? null;
}

function assinar(l: Linha): string {
  return createHmac('sha256', l.segredo_sessao).update(l.senha_hash).digest('hex');
}

/** Falso quando ainda não há senha cadastrada — ninguém entra. */
export async function acessoConfigurado(): Promise<boolean> {
  return (await linhaDeAcesso()) !== null;
}

/** Devolve o valor do cookie de sessão, ou `null` se a senha não confere. */
export async function conferirSenha(senha: string): Promise<string | null> {
  const linhas = await db.execute<Linha & { confere: boolean }>(sql`
    select senha_hash, segredo_sessao, senha_hash = crypt(${senha}, senha_hash) as confere
    from acesso where id = 1
  `);
  const l = linhas[0];
  if (!l || !l.confere) return null;
  return assinar(l);
}

// O proxy roda a cada navegação; sem cache, cada pedido custaria uma consulta.
// Dez segundos é o atraso máximo para uma troca de senha derrubar sessões.
let cache: { token: string | null; ate: number } | null = null;

async function tokenEsperado(): Promise<string | null> {
  const agora = Date.now();
  if (cache && cache.ate > agora) return cache.token;
  const l = await linhaDeAcesso();
  cache = { token: l ? assinar(l) : null, ate: agora + 10_000 };
  return cache.token;
}

export async function sessaoValida(valor: string | undefined): Promise<boolean> {
  if (!valor) return false;
  const esperado = await tokenEsperado();
  if (!esperado) return false;
  const a = Buffer.from(valor);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}
