"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A palheta.
 *
 * Mecânica real do painel de estação: a metade de cima da palheta que sai cai
 * pela dobradiça e revela, atrás dela, a palheta que já chegou. São dois
 * elementos, e só a palheta que muda anima — as outras 319 ficam paradas.
 *
 * E ela rola pelos valores intermediários: ir de 1 para 4 passa por 2 e 3,
 * como o painel rola pelo alfabeto. É o que transforma preencher a matriz em
 * uma coisa que dá vontade de fazer, que é o problema nº 1 do produto.
 */
export function Palheta({
  valor,
  sequencia,
  largura = 30,
  altura = 34,
  vazia = false,
  tom,
  rotulo,
}: {
  /** O glifo a exibir. */
  valor: string;
  /** A ordem pela qual a palheta rola. Fora dela, a troca é seca. */
  sequencia?: readonly string[];
  largura?: number;
  altura?: number;
  /** Palheta nunca virada: canal de confiança, não é um zero. */
  vazia?: boolean;
  tom?: "tinta" | "ambar" | "vermelho" | "verde" | "aco";
  rotulo?: string;
}) {
  const [mostrado, setMostrado] = useState(valor);
  const [saindo, setSaindo] = useState<string | null>(null);
  /** O que está na face agora. Fora do estado, porque a cascata o lê a cada
   *  passo e não pode esperar um re-render para saber de onde parte. */
  const face = useRef(valor);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const limpar = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    if (valor === face.current) return;
    limpar();

    const reduzido =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const de = sequencia ? sequencia.indexOf(face.current) : -1;
    const para = sequencia ? sequencia.indexOf(valor) : -1;

    // sem sequência conhecida, ou movimento reduzido: troca seca
    if (reduzido || de < 0 || para < 0) {
      face.current = valor;
      setSaindo(null);
      setMostrado(valor);
      return;
    }

    const passo = para > de ? 1 : -1;
    const caminho: string[] = [];
    for (let i = de + passo; passo > 0 ? i <= para : i >= para; i += passo) {
      caminho.push(sequencia![i]);
    }

    caminho.forEach((glifo, i) => {
      timers.current.push(
        setTimeout(() => {
          setSaindo(face.current);
          face.current = glifo;
          setMostrado(glifo);
        }, i * 95),
      );
    });
    timers.current.push(
      setTimeout(() => setSaindo(null), caminho.length * 95 + 130),
    );

    return limpar;
  }, [valor, sequencia]);

  const cor =
    tom === "ambar"
      ? "var(--color-ambar)"
      : tom === "vermelho"
        ? "var(--color-vermelho-tinta)"
        : tom === "verde"
          ? "var(--color-verde)"
          : tom === "aco"
            ? "var(--color-aco-escuro)"
            : "var(--color-tinta)";

  const caixa: React.CSSProperties = {
    width: largura,
    height: altura,
    fontSize: Math.round(altura * 0.5),
  };

  return (
    <span
      className={`dado relative inline-flex shrink-0 items-center justify-center leading-none select-none ${
        vazia ? "palheta-vazia" : "palheta"
      }`}
      style={{ ...caixa, color: cor }}
      aria-label={rotulo}
      role={rotulo ? "img" : undefined}
    >
      <span aria-hidden={rotulo ? true : undefined}>{mostrado}</span>

      {saindo !== null && (
        <span
          key={`${saindo}-${mostrado}`}
          className="palheta virando pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
          style={{ height: altura / 2, borderRadius: "2px 2px 0 0" }}
          aria-hidden="true"
        >
          <span
            className="absolute inset-x-0 top-0 inline-flex items-center justify-center leading-none"
            style={{ height: altura }}
          >
            {saindo}
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * Um número inteiro em palhetas, um dígito por palheta.
 *
 * O painel de estação nunca tem uma palheta com "23" pintado nela: tem duas
 * palhetas. E é isso que faz um número de dois dígitos rolar corretamente, em
 * vez de trocar seco por não existir na sequência de dígitos.
 */
export function PalhetaNumero({
  valor,
  largura = 26,
  altura = 34,
  tom,
  rotulo,
}: {
  valor: number;
  largura?: number;
  altura?: number;
  tom?: "tinta" | "ambar" | "vermelho" | "verde" | "aco";
  rotulo?: string;
}) {
  const digitos = String(Math.max(0, Math.round(valor))).split("");
  return (
    <span
      className="inline-flex items-center gap-px"
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
    >
      {digitos.map((d, i) => (
        <Palheta
          key={`${digitos.length}-${i}`}
          valor={d}
          sequencia={SEQUENCIA_DIGITO}
          largura={largura}
          altura={altura}
          tom={tom}
        />
      ))}
    </span>
  );
}

/** A ordem pela qual um nível rola: o traço da célula nunca avaliada, e 0 a 4. */
export const SEQUENCIA_NIVEL = ["–", "0", "1", "2", "3", "4"] as const;

/** A ordem de um dígito decimal, para os contadores do painel. */
export const SEQUENCIA_DIGITO = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
] as const;
