'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  COOKIE_ACESSO,
  VALIDADE_SESSAO_SEGUNDOS,
  conferirSenha,
} from '@/lib/auth/acesso';
import { destinoSeguro } from '@/lib/auth/destino';
import { bloqueadoPor, limparFalhas, registrarFalha } from '@/lib/auth/limite';

export type EstadoEntrada = { erro: string | null };

async function origemDoPedido(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'desconhecida';
}

export async function entrar(
  _anterior: EstadoEntrada,
  fd: FormData,
): Promise<EstadoEntrada> {
  const origem = await origemDoPedido();
  const espera = bloqueadoPor(origem);
  if (espera > 0) {
    return { erro: `Muitas tentativas. Tente de novo em ${espera} min.` };
  }

  const senha = String(fd.get('senha') ?? '').slice(0, 200);
  const token = senha ? await conferirSenha(senha) : null;

  if (!token) {
    registrarFalha(origem);
    // freia tentativa em série; o bcrypt sozinho é rápido demais para isso
    await new Promise((r) => setTimeout(r, 800));
    return { erro: 'Senha incorreta.' };
  }

  limparFalhas(origem);
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
