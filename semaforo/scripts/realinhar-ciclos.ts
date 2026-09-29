/**
 * Realinha os ciclos do seed com a data do servidor.
 *
 * POR QUE ISTO EXISTE
 *
 * O `seed-dev` antigo criava ciclos com datas fixas (`2026-08`, `2026-09`,
 * `2026-10`). Quando o relógio do servidor passou a marcar setembro, o banco
 * ficou com o mês em andamento FECHADO e um mês futuro ABERTO — o oposto da
 * regra do produto, que manda o mês corrente ficar aberto e editável até
 * acabar. O `seed-dev` já foi corrigido para gerar datas relativas; este script
 * conserta os bancos que foram semeados antes disso.
 *
 * O QUE ELE FAZ
 *
 * Desloca TODOS os ciclos do departamento pelo mesmo número de meses, de forma
 * que o mais recente caia no mês corrente. O deslocamento é uniforme, então a
 * distância entre os ciclos e toda a curva de evolução ficam intactas — só a
 * etiqueta de mês muda. Depois, fecha tudo que ficou para trás e abre o mês
 * corrente.
 *
 * ISTO SÓ É LEGÍTIMO PORQUE OS DADOS SÃO SINTÉTICOS. Os níveis vêm de
 * `db:seed-dev` e não representam o departamento real (ver PRODUCT.md, "Evidence
 * on Hand"). Num banco com a matriz real digitada, renomear o mês de uma
 * medição seria falsificar histórico — NÃO RODE ISTO EM PRODUÇÃO.
 *
 *   npx tsx --env-file=.env.local scripts/realinhar-ciclos.ts          # simula
 *   npx tsx --env-file=.env.local scripts/realinhar-ciclos.ts --aplicar
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

const aplicar = process.argv.includes('--aplicar');

async function main() {
  const ciclos = await db.execute<{
    id: string;
    departamento_id: string;
    referencia: string;
    status: string;
  }>(sql`
    select id, departamento_id, referencia::text, status
    from ciclo order by departamento_id, referencia
  `);

  if (ciclos.length === 0) {
    console.log('nenhum ciclo — nada a fazer');
    return;
  }

  const [{ mes_corrente: mesCorrente }] = await db.execute<{ mes_corrente: string }>(
    sql`select date_trunc('month', current_date)::date::text as mes_corrente`,
  );

  type LinhaCiclo = (typeof ciclos)[number];
  const porDepartamento = new Map<string, LinhaCiclo[]>();
  for (const c of ciclos) {
    porDepartamento.set(c.departamento_id, [
      ...(porDepartamento.get(c.departamento_id) ?? []),
      c,
    ]);
  }

  for (const [depId, doDep] of porDepartamento) {
    const maisRecente = doDep[doDep.length - 1].referencia;
    const meses = diferencaEmMeses(maisRecente, mesCorrente);

    console.log(`\ndepartamento ${depId}`);
    console.log(`  mais recente: ${maisRecente}   mês corrente: ${mesCorrente}`);

    if (meses === 0) {
      console.log('  já alinhado — nada a fazer');
      continue;
    }

    console.log(`  deslocamento: ${meses > 0 ? '+' : ''}${meses} mês(es)`);
    for (const c of doDep) {
      const destino = somarMeses(c.referencia, meses);
      const status = destino === mesCorrente ? 'aberto' : 'fechado';
      console.log(`    ${c.referencia} (${c.status})  →  ${destino} (${status})`);
    }

    if (!aplicar) continue;

    await db.transaction(async (tx) => {
      // A unique (departamento, referencia) impede deslocar in-place quando as
      // faixas se sobrepõem. Empurrar para bem longe primeiro e depois trazer
      // de volta evita a colisão sem tocar em nenhuma outra tabela.
      await tx.execute(sql`
        update ciclo set referencia = (referencia + interval '600 months')::date
        where departamento_id = ${Number(depId)}
      `);
      await tx.execute(sql`
        update ciclo
        set referencia =
          (referencia - interval '600 months' + (${meses} || ' months')::interval)::date
        where departamento_id = ${Number(depId)}
      `);
      await tx.execute(sql`
        update ciclo
        set status = (case
              when referencia = date_trunc('month', current_date)::date then 'aberto'
              else 'fechado' end)::status_ciclo,
            fechado_em = case
              when referencia = date_trunc('month', current_date)::date then null
              else coalesce(fechado_em, now()) end
        where departamento_id = ${Number(depId)}
      `);
    });
    console.log('  aplicado');
  }

  if (!aplicar) {
    console.log('\n(simulação — rode com --aplicar para gravar)');
  }
}

function diferencaEmMeses(de: string, para: string) {
  const [a1, m1] = de.split('-').map(Number);
  const [a2, m2] = para.split('-').map(Number);
  return (a2 - a1) * 12 + (m2 - m1);
}

function somarMeses(referencia: string, meses: number) {
  const [ano, mes] = referencia.split('-').map(Number);
  const d = new Date(ano, mes - 1 + meses, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
