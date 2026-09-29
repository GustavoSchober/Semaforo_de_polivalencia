/**
 * O conjunto de ícones do painel.
 *
 * Um único sistema: caixa de 16, traço de 1.5, ponta reta, sem preenchimento e
 * sem curva que a sinalização de estação não teria. São poucos de propósito —
 * num painel de partidas quase tudo é palavra, não pictograma.
 */

type Props = { className?: string };

function Base({ children, className }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Matriz: a grade de palhetas. */
export function IconeMatriz({ className }: Props) {
  return (
    <Base className={className}>
      <path d="M2 2.75h12v10.5H2z" />
      <path d="M2 6.25h12M2 9.75h12M6.5 2.75v10.5M11 2.75v10.5" />
    </Base>
  );
}

/** Painel de risco: a lâmpada de fileira acesa. */
export function IconePainel({ className }: Props) {
  return (
    <Base className={className}>
      <path d="M2 3.25h12M2 8h12M2 12.75h12" />
      <circle cx="12" cy="8" r="1.75" fill="currentColor" stroke="none" />
    </Base>
  );
}

/** Simulador: a linha que sai do painel. */
export function IconeSimulador({ className }: Props) {
  return (
    <Base className={className}>
      <path d="M9.5 2.75H2.75v10.5H9.5" />
      <path d="M7 8h7M11.25 5.25 14 8l-2.75 2.75" />
    </Base>
  );
}

/** Evolução: a trilha plotada entre ciclos. */
export function IconeEvolucao({ className }: Props) {
  return (
    <Base className={className}>
      <path d="M2 13.25V2.75M2 13.25h12" />
      <path d="m4.5 10.5 3-3.25 2.5 2 3.5-4.75" />
    </Base>
  );
}

/** Seta de ação, a mesma do painel real. */
export function IconeSeta({ className }: Props) {
  return (
    <Base className={className}>
      <path d="M2.5 8h11M10 4.5 13.5 8 10 11.5" />
    </Base>
  );
}

/** Tema claro. */
export function IconeSol({ className }: Props) {
  return (
    <Base className={className}>
      <circle cx="8" cy="8" r="3.1" />
      <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.15 1.15M11.45 11.45l1.15 1.15M12.6 3.4l-1.15 1.15M4.55 11.45L3.4 12.6" />
    </Base>
  );
}

/** Tema escuro. */
export function IconeLua({ className }: Props) {
  return (
    <Base className={className}>
      <path d="M13 9.6A5.6 5.6 0 0 1 6.4 3a5.7 5.7 0 1 0 6.6 6.6Z" />
    </Base>
  );
}

/** Informação: o que há por trás de um número. Desenhado, não a letra "i". */
export function IconeInfo({ className }: Props) {
  return (
    <Base className={className}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.25v4" />
      <circle cx="8" cy="4.9" r=".85" fill="currentColor" stroke="none" />
    </Base>
  );
}

/** Gerenciar: a ficha de cadastro. */
export function IconeGerenciar({ className }: Props) {
  return (
    <Base className={className}>
      <path d="M3 2.75h10v10.5H3z" />
      <path d="M5.5 6h5M5.5 8.75h5M5.5 11h3" />
    </Base>
  );
}

/** Direção da variação: subiu, caiu, ficou parado. Desenhada, não um glifo. */
export function IconeTendencia({
  direcao,
  className,
}: Props & { direcao: "sobe" | "cai" | "parado" }) {
  return (
    <Base className={className}>
      {direcao === "parado" ? (
        <path d="M3 8h10" />
      ) : direcao === "sobe" ? (
        <path d="M8 13V4M4 7.75 8 3.5l4 4.25" />
      ) : (
        <path d="M8 3v9M4 8.25 8 12.5l4-4.25" />
      )}
    </Base>
  );
}

/** Aviso de serviço: o dado em que não se deve confiar ainda. */
export function IconeAviso({ className }: Props) {
  return (
    <Base className={className}>
      <path d="M8 2.5 14.5 13.5h-13z" />
      <path d="M8 6.75v3" />
      <circle cx="8" cy="11.6" r=".85" fill="currentColor" stroke="none" />
    </Base>
  );
}
