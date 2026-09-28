"use client";

import { Palheta, SEQUENCIA_DIGITO } from "./palheta";

/**
 * A cobertura como contador de palhetas.
 *
 * Não é um percentual numa caixa. A meta é um recipiente com capacidade
 * visível: o trilho abaixo dos dígitos enche até a marca das 3 pessoas por
 * nível, que é o 100% desta escala — e por isso a marca é rotulada, em vez de
 * deixar o leitor supor que 100% significa "todo mundo sabe tudo".
 */
export function ContadorCobertura({
  valor,
  rotulo = "Cobertura do departamento",
  tamanho = "grande",
}: {
  /** 0 a 1, ou null quando não há tarefa para medir. */
  valor: number | null | undefined;
  rotulo?: string;
  tamanho?: "grande" | "medio" | "linha";
}) {
  // "linha" existe para a matriz: lá cada pixel de cromagem custa uma tarefa
  // visível, e 64 linhas de quadro valem mais que um contador imponente.
  const emLinha = tamanho === "linha";
  const largura = tamanho === "grande" ? 26 : emLinha ? 20 : 19;
  const altura = tamanho === "grande" ? 40 : emLinha ? 28 : 28;

  const vazio = valor === null || valor === undefined;
  // duas casas, como a planilha sempre apresentou
  const centesimos = vazio ? 0 : Math.round(valor * 10000);
  const texto = String(centesimos).padStart(4, "0");
  const digitos = texto.slice(0, texto.length - 2).padStart(2, "0") + texto.slice(-2);
  const glifos = digitos.split("");

  return (
    <div
      className={
        emLinha
          ? "flex flex-wrap items-center gap-x-4 gap-y-1"
          : "flex flex-col gap-2"
      }
    >
      <span className="rotulo">{rotulo}</span>

      {vazio ? (
        <span className="dado text-aco-escuro" style={{ fontSize: altura * 0.5 }}>
          sem tarefas para medir
        </span>
      ) : (
        <>
          <span
            className="flex items-end gap-px"
            role="img"
            aria-label={`${rotulo}: ${digitos.slice(0, -2)},${digitos.slice(-2)} por cento da meta`}
          >
            {glifos.map((g, i) => (
              <span key={i} className="flex items-end gap-px">
                <Palheta
                  valor={g}
                  sequencia={SEQUENCIA_DIGITO}
                  largura={largura}
                  altura={altura}
                />
                {i === glifos.length - 3 && (
                  <span
                    aria-hidden="true"
                    className="dado pb-1 text-tinta-fraca"
                    style={{ fontSize: altura * 0.42 }}
                  >
                    ,
                  </span>
                )}
              </span>
            ))}
            <span
              aria-hidden="true"
              className="dado pb-1 pl-1 text-tinta-fraca"
              style={{ fontSize: altura * 0.36 }}
            >
              %
            </span>
          </span>

          <span className={emLinha ? "flex items-center gap-2" : "flex items-center gap-2"}>
            <span
              className={`relative h-[5px] overflow-hidden bg-flap-borda ${
                emLinha ? "w-40" : "w-full min-w-40"
              }`}
              aria-hidden="true"
            >
              <span
                className="absolute inset-y-0 left-0 bg-tinta transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(valor * 100, 100)}%` }}
              />
            </span>
            <span className="rotulo whitespace-nowrap">meta 3 pessoas</span>
          </span>
        </>
      )}
    </div>
  );
}
