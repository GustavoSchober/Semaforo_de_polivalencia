import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_ACESSO, sessaoValida } from '@/lib/auth/acesso';

/**
 * A porta do app: sem sessão válida, nada além da tela de entrada responde —
 * nem página, nem Server Action.
 *
 * Na Vercel (`ORIGEM_SERVIDOR` definida) o projeto só repassa pedidos para o
 * servidor, e quem decide é o servidor. Lá não há banco para consultar.
 */
export async function proxy(req: NextRequest) {
  if (process.env.ORIGEM_SERVIDOR) return NextResponse.next();

  if (req.nextUrl.pathname === '/entrar') return NextResponse.next();

  if (await sessaoValida(req.cookies.get(COOKIE_ACESSO)?.value)) {
    return NextResponse.next();
  }

  // uma Server Action não segue redirecionamento como navegação: responde
  // com erro, e a tela pede para entrar de novo
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new NextResponse('Sessão expirada. Entre de novo.', { status: 401 });
  }

  const destino = req.nextUrl.clone();
  destino.pathname = '/entrar';
  destino.search = '';
  const volta = req.nextUrl.pathname + req.nextUrl.search;
  if (volta !== '/') destino.searchParams.set('volta', volta);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)'],
};
