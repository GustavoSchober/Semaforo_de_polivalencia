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
      allowedOrigins: [
        "*.vercel.app",
        ...(process.env.DOMINIOS_PUBLICOS?.split(",").map((d) => d.trim()).filter(Boolean) ?? []),
      ],
    },
  },

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
