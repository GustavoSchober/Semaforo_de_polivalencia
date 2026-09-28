/**
 * A palheta que não vira.
 *
 * Mesma superfície da palheta viva, sem nenhum JavaScript. É o que o painel
 * usa onde o valor não muda sob a mão de ninguém — as telas de leitura. A
 * palheta viva existe só onde há edição ou simulação.
 */
export function PalhetaFixa({
  children,
  largura = 30,
  altura = 34,
  vazia = false,
  tom = "tinta",
  titulo,
  className = "",
}: {
  children: React.ReactNode;
  largura?: number | string;
  altura?: number;
  vazia?: boolean;
  tom?: "tinta" | "ambar" | "vermelho" | "verde" | "aco";
  titulo?: string;
  className?: string;
}) {
  const cor = {
    tinta: "var(--color-tinta)",
    ambar: "var(--color-ambar)",
    vermelho: "var(--color-vermelho-tinta)",
    verde: "var(--color-verde)",
    aco: "var(--color-aco-escuro)",
  }[tom];

  return (
    <span
      title={titulo}
      className={`dado inline-flex shrink-0 items-center justify-center leading-none ${
        vazia ? "palheta-vazia" : "palheta"
      } ${className}`}
      style={{
        width: largura,
        height: altura,
        fontSize: Math.round(altura * 0.5),
        color: cor,
      }}
    >
      {children}
    </span>
  );
}
