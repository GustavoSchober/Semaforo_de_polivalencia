import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { segredoObrigatorio } from '@/lib/segredos';
import * as schema from './schema';

const url = segredoObrigatorio(
  'DATABASE_URL',
  'copie .env.example para .env.local, ou monte o segredo em DATABASE_URL_FILE',
);

// Em desenvolvimento o Next recarrega o módulo a cada edição; sem o cache
// global, cada recarga abriria um pool novo e o Postgres esgotaria conexões.
const globalParaHmr = globalThis as unknown as { clienteSql?: ReturnType<typeof postgres> };

const clienteSql = globalParaHmr.clienteSql ?? postgres(url, { max: 10 });
if (process.env.NODE_ENV !== 'production') globalParaHmr.clienteSql = clienteSql;

export const db = drizzle(clienteSql, { schema, casing: 'snake_case' });
export { schema };
