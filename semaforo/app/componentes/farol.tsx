import { farol, type Farol } from "@/lib/dominio/farol";
import { META_POR_TAREFA, ROTULO_NIVEL, type Nivel } from "@/lib/dominio/constantes";
import { PalhetaFixa } from "./palheta-fixa";

/**
 * O farol, no vocabulário do painel de partidas.
 *
 * A regra é a do sponsor e não se negocia: menos de 2 pessoas é vermelho,
 * exatamente 2 é amarelo, 3 ou mais é verde. Zero e um são ambos vermelhos.
 *
 * A tradução declarada no contrato de direção: o verde não pinta a linha. Num
 * painel em que a maioria das fileiras brilha, nada lê — então verde é lâmpada
 * pequena e a tinta fica branca, e só âmbar e vermelho ganham tratamento cheio.
 * A cor entra onde a regra dispara, e em lugar nenhum além disso.
 */

export const TOM_FAROL: Record<Farol, "tinta" | "ambar" | "vermelho"> = {
  verde: "tinta",
  amarelo: "ambar",
  vermelho: "vermelho",
};

const CLASSE_LAMPADA: Record<Farol, string> = {
  verde: "lampada-verde",
  amarelo: "lampada-ambar",
  vermelho: "lampada-vermelha",
};

/** Quantas pessoas viram quê. A frase curta que o painel imprime. */
export function situacao(pessoas: number): string {
  if (pessoas === 0) return "ninguém";
  if (pessoas === 1) return "só 1 pessoa";
  if (pessoas === 2) return "backup 2";
  return "coberta";
}

/** A lâmpada de fileira. O segundo canal do estado, junto do número. */
export function Lampada({
  pessoas,
  tamanho = 7,
}: {
  pessoas: number;
  tamanho?: number;
}) {
  const cor = farol(pessoas);
  return (
    <span
      className={`lampada ${CLASSE_LAMPADA[cor]} inline-block shrink-0`}
      style={{ width: tamanho, height: tamanho }}
      aria-hidden="true"
    />
  );
}

/**
 * A célula do semáforo: o número de pessoas numa palheta, tingida pela regra.
 * O número é o canal primário; a cor é o reforço. Nunca o contrário.
 */
export function CelulaFarol({
  pessoas,
  nivel,
  largura = 30,
  altura = 34,
}: {
  pessoas: number;
  /** Qual nível esta coluna conta, para a leitura assistiva fazer sentido. */
  nivel?: Nivel;
  largura?: number;
  altura?: number;
}) {
  const cor = farol(pessoas);
  const legenda = nivel
    ? `${pessoas} ${pessoas === 1 ? "pessoa" : "pessoas"} em nível ${nivel} ou acima — ${ROTULO_NIVEL[nivel].toLowerCase()} — ${situacao(pessoas)}`
    : `${pessoas} ${pessoas === 1 ? "pessoa" : "pessoas"} — ${situacao(pessoas)}`;

  return (
    <PalhetaFixa
      largura={largura}
      altura={altura}
      tom={TOM_FAROL[cor]}
      titulo={legenda}
    >
      <span className="sr-only">{legenda}</span>
      <span aria-hidden="true">{pessoas}</span>
    </PalhetaFixa>
  );
}

/**
 * A placa de situação da fileira — o equivalente ao ON TIME / DELAYED /
 * CANCELLED do painel.
 *
 * As palavras falam de PESSOAS, nunca de prazo: a coluna de horário ao lado já
 * carrega o prazo da obrigação, e uma placa dizendo "ATRASADO" seria lida como
 * entrega em atraso. Essa confusão custaria mais do que a metáfora vale.
 */
export function PlacaSituacao({ pessoas }: { pessoas: number }) {
  const cor = farol(pessoas);
  const texto = situacao(pessoas).toUpperCase();

  if (cor === "verde") {
    return (
      <span className="rotulo-forte inline-flex items-center gap-2 border border-aco-escuro/45 px-2 py-1 text-[0.625rem]">
        <Lampada pessoas={pessoas} tamanho={6} />
        {texto}
      </span>
    );
  }

  if (cor === "amarelo") {
    return (
      <span className="placa inline-flex items-center gap-2 bg-ambar px-2 py-1 text-[0.625rem] text-flap">
        {texto}
      </span>
    );
  }

  // Dentro do vermelho ainda há hierarquia: ninguém executa é pior do que uma
  // pessoa executa. Numa lista em que TODA linha é vermelha por construção, uma
  // parede de placas idênticas não informa — a diferença entre cheia e vazada é
  // o que separa as duas.
  const ninguem = pessoas === 0;
  return (
    <span
      className={`placa inline-flex items-center gap-2 px-2 py-1 text-[0.625rem] ${
        ninguem
          ? "bg-vermelho text-tinta"
          : "border border-vermelho text-vermelho-tinta"
      }`}
    >
      {texto}
    </span>
  );
}

/**
 * A régua, impressa junto do resultado.
 *
 * Princípio do produto: ninguém é avaliado por uma régua invisível. Esta faixa
 * é a razão de a matriz não precisar de treinamento para ser lida.
 */
export function LegendaFarol({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 ${className}`}>
      <span className="rotulo">Farol por tarefa</span>
      <span className="flex items-center gap-2">
        <Lampada pessoas={0} />
        <span className="dado text-[0.6875rem] tracking-wider text-tinta-fraca uppercase">
          0 ou 1 pessoa
        </span>
      </span>
      <span className="flex items-center gap-2">
        <Lampada pessoas={2} />
        <span className="dado text-[0.6875rem] tracking-wider text-tinta-fraca uppercase">
          2 pessoas
        </span>
      </span>
      <span className="flex items-center gap-2">
        <Lampada pessoas={3} />
        <span className="dado text-[0.6875rem] tracking-wider text-tinta-fraca uppercase">
          {META_POR_TAREFA} ou mais — a meta
        </span>
      </span>
    </div>
  );
}

/** A escala de domínio, impressa por extenso onde ela é usada. */
export function LegendaNiveis({ className = "" }: { className?: string }) {
  return (
    <dl className={`flex flex-wrap gap-x-7 gap-y-2 ${className}`}>
      {([1, 2, 3, 4] as const).map((n) => (
        <div key={n} className="flex items-baseline gap-2">
          <dt>
            <PalhetaFixa largura={20} altura={24}>
              {n}
            </PalhetaFixa>
          </dt>
          <dd className="dado text-[0.6875rem] tracking-wider text-tinta-fraca uppercase">
            {ROTULO_NIVEL[n]}
          </dd>
        </div>
      ))}
    </dl>
  );
}
