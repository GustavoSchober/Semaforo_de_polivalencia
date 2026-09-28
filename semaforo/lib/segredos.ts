import { readFileSync } from 'node:fs';

/**
 * Lê uma variável de ambiente aceitando também a convenção `_FILE`.
 *
 * Em desenvolvimento, `DATABASE_URL` vem do `.env.local`. Em produção, o
 * Docker Compose monta o segredo em `/run/secrets/...` e passa o caminho em
 * `DATABASE_URL_FILE` — o valor nunca aparece em `docker inspect` nem no
 * histórico de shell.
 *
 * O `trimEnd` existe porque uma quebra de linha no fim do arquivo vira parte da
 * senha, e o erro que isso produz não ajuda em nada a descobrir a causa.
 */
export function segredo(nome: string): string | undefined {
  const caminho = process.env[`${nome}_FILE`];
  if (caminho) {
    try {
      return readFileSync(caminho, 'utf8').trimEnd();
    } catch (e) {
      throw new Error(`não foi possível ler ${nome}_FILE (${caminho}): ${e}`);
    }
  }
  return process.env[nome];
}

export function segredoObrigatorio(nome: string, dica: string): string {
  const v = segredo(nome);
  if (!v) throw new Error(`${nome} não definida — ${dica}`);
  return v;
}
