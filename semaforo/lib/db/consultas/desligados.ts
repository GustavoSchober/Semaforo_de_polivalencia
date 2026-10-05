import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { RETENCAO_DESLIGADO_MESES } from '@/lib/dominio/constantes';

/**
 * O que sobra de quem saiu, e por quanto tempo.
 *
 * Desligar faz a pessoa sumir de todas as telas de operação — matriz, painel,
 * simulador, evolução — porque nenhuma delas descreve o departamento de hoje
 * com ela dentro. Mas o quadro que ela deixou ainda responde perguntas reais:
 * quem herdou as tarefas que só ela fazia, e o que precisa ser recuperado se
 * ela voltar.
 *
 * Então o dado não some junto com a pessoa: ele se muda para cá, para um lugar
 * só, com prazo. Passados `RETENCAO_DESLIGADO_MESES` meses, o expurgo apaga de
 * verdade — e a readmissão deixa de existir junto, porque readmitir sem o
 * quadro seria cadastrar alguém de novo com outro nome para a mesma coisa.
 */

export type LinhaDoHistorico = {
  setor: string;
  descricao: string;
  valor: number;
  avaliado: boolean;
};

export type HistoricoDesligado = {
  /** o ciclo de onde o quadro foi lido — o último em que a pessoa tinha dados */
  referencia: string;
  cicloId: number;
  executaSozinho: number;
  ensina: number;
  linhas: LinhaDoHistorico[];
};

/**
 * O quadro que a pessoa deixou, lido do último ciclo em que ela tem linhas.
 *
 * Lê de `nivel` cru de propósito — é o único lugar do sistema que faz isso. A
 * view `v_nivel_vigente` foi feita exatamente para esconder quem saiu, e aqui a
 * pergunta é a oposta.
 */
export async function historicoDoDesligado(
  colaboradorId: number,
): Promise<HistoricoDesligado | null> {
  const linhas = await db.execute<{
    ciclo_id: string;
    referencia: string;
    setor: string;
    descricao: string;
    valor: number;
    avaliado: boolean;
  }>(sql`
    with ultimo as (
      select n.ciclo_id
      from nivel n
      join ciclo c on c.id = n.ciclo_id
      where n.colaborador_id = ${colaboradorId}
      group by n.ciclo_id, c.referencia
      -- o ciclo mais recente em que alguém de fato avaliou essa pessoa; se
      -- nunca avaliaram, o mais recente em que ela teve quadro aberto
      order by count(*) filter (where n.avaliado) > 0 desc, c.referencia desc
      limit 1
    )
    select n.ciclo_id, c.referencia::text, s.nome as setor, t.descricao,
           n.valor, n.avaliado
    from nivel n
    join ultimo u on u.ciclo_id = n.ciclo_id
    join ciclo  c on c.id = n.ciclo_id
    join tarefa t on t.id = n.tarefa_id
    join setor  s on s.id = t.setor_id
    where n.colaborador_id = ${colaboradorId}
      and n.avaliado
      and n.valor > 0
    order by s.ordem, t.ordem
  `);

  if (linhas.length === 0) return null;

  return {
    cicloId: Number(linhas[0].ciclo_id),
    referencia: linhas[0].referencia,
    executaSozinho: linhas.filter((l) => l.valor >= 3).length,
    ensina: linhas.filter((l) => l.valor === 4).length,
    linhas: linhas.map((l) => ({
      setor: l.setor,
      descricao: l.descricao,
      valor: l.valor,
      avaliado: l.avaliado,
    })),
  };
}

/**
 * Apaga de verdade quem saiu há mais de três meses.
 *
 * Não há cron neste projeto — a virada do mês também acontece no primeiro
 * acesso, pelo mesmo motivo (ver `lib/db/ciclo-vigente`). O expurgo roda junto
 * da virada e sempre que a tela de cadastro é aberta, que é onde o efeito
 * aparece: a pessoa deixa de estar na lista de desligados e o botão de
 * readmitir deixa de existir.
 *
 * Devolve quem foi apagado, para o log do servidor. É a única escrita
 * destrutiva do sistema e não deve acontecer em silêncio.
 */
export async function expurgarDesligados(departamentoId: number) {
  const apagados = await db.execute<{ id: string; nome: string; saida_em: string }>(sql`
    select id, nome, saida_em::text
    from f_expurgar_desligados(${departamentoId}, ${RETENCAO_DESLIGADO_MESES})
  `);

  if (apagados.length > 0) {
    console.info(
      `expurgo de desligados (${RETENCAO_DESLIGADO_MESES} meses):`,
      apagados.map((a) => `${a.nome} (saiu em ${a.saida_em})`).join(', '),
    );
  }

  return apagados.map((a) => ({
    id: Number(a.id),
    nome: a.nome,
    saidaEm: a.saida_em,
  }));
}
