import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { segredoObrigatorio } from '@/lib/segredos';
import * as schema from './schema';

type Banco = ReturnType<typeof drizzle<typeof schema>>;

// Em desenvolvimento o Next recarrega o módulo a cada edição; sem o cache
// global, cada recarga abriria um pool novo e o Postgres esgotaria conexões.
const globalParaHmr = globalThis as unknown as {
  clienteSql?: ReturnType<typeof postgres>;
  banco?: Banco;
};

function conectar(): Banco {
  if (globalParaHmr.banco) return globalParaHmr.banco;

  const url = segredoObrigatorio(
    'DATABASE_URL',
    'copie .env.example para .env.local, ou monte o segredo em DATABASE_URL_FILE',
  );
  const clienteSql = globalParaHmr.clienteSql ?? postgres(url, { max: 10 });
  globalParaHmr.clienteSql = clienteSql;
  globalParaHmr.banco = drizzle(clienteSql, { schema, casing: 'snake_case' });
  return globalParaHmr.banco;
}

/**
 * A conexão só é aberta no primeiro uso, e não na importação do módulo.
 *
 * O `next build` avalia cada rota para coletar a configuração dela, e isso
 * importa este arquivo. Com a conexão no topo do módulo, o build exigia
 * `DATABASE_URL` — e quebrava em qualquer máquina de build sem banco (a
 * Vercel, o estágio de build do Dockerfile).
 */
export const db = new Proxy({} as Banco, {
  get(_alvo, prop) {
    const banco = conectar();
    const valor = Reflect.get(banco, prop, banco);
    return typeof valor === 'function' ? valor.bind(banco) : valor;
  },
});

export { schema };
