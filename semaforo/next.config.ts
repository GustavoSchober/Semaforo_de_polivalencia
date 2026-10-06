import type { NextConfig } from "next";

/**
 * A aplicação e o banco rodam no servidor próprio (Docker Compose, ver
 * `docker/`). A Vercel só empresta o domínio: quando `ORIGEM_SERVIDOR` está
 * definida (nas variáveis de ambiente do projeto na Vercel), todo pedido —
 * páginas, `_next/static`, Server Actions — é repassado para o servidor.
 *
 * Sem a variável, o build é o build normal da aplicação.
 */
const origemServidor = process.env.ORIGEM_SERVIDOR?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // imagem pequena e sem node_modules completo, para auto-hospedagem
  output: "standalone",

  experimental: {
    serverActions: {
      // O navegador está no domínio da Vercel, e o pedido chega aqui pelo
      // proxy. Sem estas entradas a checagem de CSRF das Server Actions
      // recusaria toda gravação feita pelo domínio público.
      // Só o domínio deste projeto: `*.vercel.app` aceitaria qualquer app
      // hospedado na Vercel como origem de uma gravação.
      allowedOrigins: [
        "semaforo-de-polivalencia.vercel.app",
        ...(process.env.DOMINIOS_PUBLICOS?.split(",").map((d) => d.trim()).filter(Boolean) ?? []),
      ],
    },
  },

  // Os cabeçalhos que o Caddy aplicava, agora na própria aplicação.
  async headers() {
    return [
      {
        source: "/:caminho*",
        headers: [
          // ninguém embute o app num iframe para induzir cliques (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  poweredByHeader: false,

  async rewrites() {
    if (!origemServidor) return [];
    return {
      beforeFiles: [{ source: "/:caminho*", destination: `${origemServidor}/:caminho*` }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
