import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

// os testes de cálculo falam com o Postgres; os de domínio não falam com nada.
// Carregar o .env.local aqui mantém `vitest` utilizável direto, sem wrapper.
const env = resolve(import.meta.dirname, '.env.local');
if (existsSync(env)) {
  for (const linha of readFileSync(env, 'utf8').split('\n')) {
    const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, '.') },
  },
  test: {
    include: ['testes/**/*.test.ts'],
    // os testes de banco compartilham um schema: rodá-los em paralelo faria
    // um apagar o cenário do outro
    fileParallelism: false,
  },
});
