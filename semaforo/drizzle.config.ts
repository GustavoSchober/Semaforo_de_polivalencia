import { defineConfig } from 'drizzle-kit';
import { segredo } from './lib/segredos';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    // no servidor o valor vem de DATABASE_URL_FILE (segredo do Compose)
    url: segredo('DATABASE_URL')!,
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
