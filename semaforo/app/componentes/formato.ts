export function percentual(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return `${(v * 100).toFixed(2).replace(".", ",")}%`;
}

export function variacaoPercentual(v: number | null | undefined) {
  if (v === null || v === undefined) return null;
  const sinal = v > 0 ? "+" : "";
  return `${sinal}${(v * 100).toFixed(2).replace(".", ",")} p.p.`;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function referenciaLegivel(referencia: string) {
  const [ano, mes] = referencia.split("-");
  return `${MESES[Number(mes) - 1]} de ${ano}`;
}

/**
 * "outubro de 2026" → "Outubro de 2026".
 *
 * Não use `capitalize` do CSS para isto: ele maiusculiza cada palavra e produz
 * "Outubro De 2026".
 */
export function referenciaTitulo(referencia: string) {
  const t = referenciaLegivel(referencia);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** "2026-08-01" → "ago/26", para caber num eixo de gráfico. */
export function referenciaCurta(referencia: string) {
  const [ano, mes] = referencia.split("-");
  return `${MESES_CURTOS[Number(mes) - 1]}/${ano.slice(2)}`;
}

/**
 * O horário de partida da tarefa.
 *
 * Não é licença poética: uma obrigação fiscal tem prazo de entrega, e
 * `prazo_ancora` guarda exatamente isso ("dia 10", "dia 20"). Quando não há
 * prazo fixo, a periodicidade ocupa a coluna — é o que o painel de estação faz
 * com um serviço que não tem horário, e não uma célula vazia.
 */
export function horarioDaTarefa(
  prazoAncora: string | null,
  periodicidade: string,
) {
  if (prazoAncora && prazoAncora.trim() !== "") return prazoAncora;
  const normal: Record<string, string> = {
    diaria: "diária",
    diária: "diária",
    semanal: "semanal",
    mensal: "mensal",
    anual: "anual",
    eventual: "eventual",
  };
  return normal[periodicidade.toLowerCase()] ?? periodicidade;
}

/** Plural sem gambiarra de string, porque a interface fala português. */
export function pessoas(n: number) {
  return `${n} ${n === 1 ? "pessoa" : "pessoas"}`;
}

export function tarefas(n: number) {
  return `${n} ${n === 1 ? "tarefa" : "tarefas"}`;
}
