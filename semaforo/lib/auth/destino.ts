/**
 * Só caminhos internos: `volta` vem da URL e não pode virar redirecionamento
 * aberto.
 *
 * Checar só "começa com / e não com //" não basta: o navegador trata `\` como
 * `/`, então `/\site.com` sairia do domínio. Resolver contra uma origem fictícia
 * e exigir que ela não mude cobre essas variações todas.
 */
export function destinoSeguro(volta: unknown): string {
  if (typeof volta !== 'string' || !volta.startsWith('/')) return '/';
  try {
    const base = 'http://interno.invalid';
    const url = new URL(volta, base);
    if (url.origin !== base) return '/';
    return url.pathname + url.search;
  } catch {
    return '/';
  }
}
