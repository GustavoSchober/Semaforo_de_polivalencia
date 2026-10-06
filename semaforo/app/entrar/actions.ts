'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  COOKIE_ACESSO,
  VALIDADE_SESSAO_SEGUNDOS,
  conferirSenha,
} from '@/lib/auth/acesso';

export type EstadoEntrada = { erro: string | null };

/** Só caminhos internos: `volta` vem da URL e não pode virar redirecionamento aberto. */
function destinoSeguro(volta: FormDataEntryValue | null): string {
  if (typeof volta !== 'string' || !volta.startsWith('/') || volta.startsWith('//')) {
    return '/';
  }
  return volta;
}

export async function entrar(
  _anterior: EstadoEntrada,
  fd: FormData,
): Promise<EstadoEntrada> {
  const senha = String(fd.get('senha') ?? '');
  const token = senha ? await conferirSenha(senha) : null;

  if (!token) {
    // freia tentativa em série; o bcrypt sozinho é rápido demais para isso
    await new Promise((r) => setTimeout(r, 800));
    return { erro: 'Senha incorreta.' };
  }

  (await cookies()).set(COOKIE_ACESSO, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: VALIDADE_SESSAO_SEGUNDOS,
  });
  redirect(destinoSeguro(fd.get('volta')));
}

export async function sair(): Promise<void> {
  (await cookies()).delete(COOKIE_ACESSO);
  redirect('/entrar');
}
