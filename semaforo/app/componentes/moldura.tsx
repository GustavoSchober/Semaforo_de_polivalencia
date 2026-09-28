import Link from "next/link";
import { TrocaDeTema } from "./tema";
import {
  IconeEvolucao,
  IconeGerenciar,
  IconeMatriz,
  IconePainel,
  IconeSimulador,
} from "./icones";

export type Modo =
  | "matriz"
  | "painel"
  | "simulador"
  | "evolucao"
  | "gerenciar"
  | "ciclos";

/**
 * A moldura de aço.
 *
 * As cinco rotas não são cinco páginas: são modos do mesmo painel, dentro de
 * uma moldura que nunca sai da tela. Foi a disciplina que a folha desdobrável
 * doou a esta direção, e é o que responde ao "pouco intuitivo" do pedido — a
 * pessoa nunca perde de vista onde está nem o que mais existe.
 *
 * A moldura vive no fluxo da página e sobe com ela. Prendê-la no topo custava
 * altura útil em toda tela e, pior, produzia a tela preta — ver o comentário
 * no corpo do componente.
 */

function Rebite({ lado }: { lado: "left" | "right" }) {
  return (
    <span
      className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
      style={{
        [lado]: 12,
        background:
          "radial-gradient(circle at 35% 30%, #f4f6f8 0%, #a8aeb6 45%, #565b63 100%)",
        boxShadow: "0 1px 2px rgba(0,0,0,.5), inset 0 -1px 1px rgba(0,0,0,.25)",
      }}
    />
  );
}

/** A faixa de aço escovado com rebites. Separa regiões; não decora. */
export function Trilho({ className = "" }: { className?: string }) {
  return (
    <div
      className={`aco relative h-2.5 shrink-0 border-y border-black ${className}`}
      aria-hidden="true"
    >
      <Rebite lado="left" />
      <Rebite lado="right" />
    </div>
  );
}

const MODOS = [
  { id: "matriz", rotulo: "Matriz", Icone: IconeMatriz, rota: (c: number) => `/matriz/${c}` },
  { id: "painel", rotulo: "Painel de risco", Icone: IconePainel, rota: (c: number) => `/painel/${c}` },
  { id: "simulador", rotulo: "Simulador", Icone: IconeSimulador, rota: (c: number) => `/simulador/${c}` },
] as const;

export function Painel({
  modo,
  departamento,
  cicloId,
  cicloRotulo,
  cicloFechado = false,
  direita,
  children,
  rodape,
}: {
  modo: Modo;
  departamento: string;
  /** Ausente em /evolucao e na lista de ciclos, que não pertencem a um ciclo. */
  cicloId?: number;
  cicloRotulo?: string;
  cicloFechado?: boolean;
  /** Faixa de indicadores fixa, entre a moldura e a área que rola. */
  direita?: React.ReactNode;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  return (
    /* Fluxo normal de página, e é deliberado.
     *
     * A versão anterior travava a altura em `h-dvh` e deixava o `<main>` rolar
     * por dentro. Isso produzia um bug grave: o documento continuava rolável
     * (scrollHeight de 6203px numa viewport de 788), então a página inteira
     * subia, levava o app de altura fixa para fora da tela e deixava à mostra
     * o fundo preto do body — a "tela preta infinita". Além do bug, a moldura
     * fixa comia mais de um terço da altura útil em cada tela.
     *
     * Moldura no fluxo resolve os dois de uma vez. */
    <div className="flex min-h-dvh flex-col bg-flap">
      <header className="shrink-0">
        {/* A chapa da moldura: 64px de aço escovado, de borda a borda.
            `min-h` e não `h`: os 64px são contrato de desktop, e a altura
            travada fazia o conteúdo transbordar por cima da navegação assim que
            a linha quebrava — o que acontece em qualquer tela estreita. */}
        <div className="aco relative flex min-h-16 flex-wrap items-center justify-between gap-x-8 gap-y-2 border-b border-black px-9 py-2">
          <Rebite lado="left" />
          <Rebite lado="right" />

          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <Link
              href="/"
              className="group flex items-baseline gap-2.5 focus-visible:outline-offset-4"
            >
              <span className="placa text-[0.9375rem] text-tinta group-hover:text-ambar-chapa">
                Semáforo
              </span>
              <span className="rotulo group-hover:text-tinta">de Polivalência</span>
            </Link>
            <span className="rotulo-forte text-[0.6875rem] text-tinta">
              {departamento}
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
            <TrocaDeTema />
          </div>

          {cicloRotulo && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-2">
              <span className="rotulo">Ciclo</span>
              <span className="placa text-[0.75rem] text-tinta">{cicloRotulo}</span>
              {cicloFechado && (
                <span
                  className="rotulo-forte border border-aco-escuro px-1.5 py-0.5 text-[0.5625rem] text-tinta"
                  title="Ciclo fechado é imutável, inclusive para o gestor."
                >
                  Fechado
                </span>
              )}
              <Link href="/" className="rotulo underline-offset-4 hover:underline">
                trocar
              </Link>
            </div>
          )}
        </div>

        <nav
          className="aco-escura flex flex-wrap items-stretch border-b border-black"
          aria-label="Modos do painel"
        >
          <ul className="flex flex-wrap items-stretch">
            {MODOS.map(({ id, rotulo, Icone, rota }) => {
              const ativo = modo === id;
              if (cicloId === undefined) {
                return (
                  <li key={id}>
                    <span
                      className="rotulo flex h-full items-center gap-2.5 border-r border-black/60 px-4 py-3 opacity-45"
                      title="Escolha um ciclo para abrir este modo"
                    >
                      <Icone />
                      {rotulo}
                    </span>
                  </li>
                );
              }
              return (
                <li key={id}>
                  <Link
                    href={rota(cicloId)}
                    aria-current={ativo ? "page" : undefined}
                    className={`flex h-full items-center gap-2.5 border-r border-black/60 px-4 py-3 transition-colors ${
                      ativo
                        ? "rotulo-forte bg-flap text-[0.6875rem] tracking-[0.16em] text-ambar"
                        : "rotulo hover:bg-black/25 hover:text-tinta"
                    }`}
                  >
                    <Icone />
                    {rotulo}
                  </Link>
                </li>
              );
            })}
            {(
              [
                { id: "evolucao", rotulo: "Evolução", Icone: IconeEvolucao, href: "/evolucao" },
                { id: "gerenciar", rotulo: "Gerenciar", Icone: IconeGerenciar, href: "/gerenciar" },
              ] as const
            ).map(({ id, rotulo, Icone, href }) => (
              <li key={id}>
                <Link
                  href={href}
                  aria-current={modo === id ? "page" : undefined}
                  className={`flex h-full items-center gap-2.5 border-r border-black/60 px-4 py-3 transition-colors ${
                    modo === id
                      ? "rotulo-forte bg-flap text-[0.6875rem] tracking-[0.16em] text-ambar"
                      : "rotulo hover:bg-black/25 hover:text-tinta"
                  }`}
                >
                  <Icone />
                  {rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {direita && (
        <div className="shrink-0 border-b border-black bg-flap px-5 py-4">{direita}</div>
      )}

      <main className="flex flex-1 flex-col">{children}</main>

      {rodape && (
        <footer className="shrink-0">
          <Trilho />
          <div className="aco-escura px-5 py-4">{rodape}</div>
        </footer>
      )}
    </div>
  );
}
