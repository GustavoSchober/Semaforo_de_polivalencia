"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconeInfo } from "./icones";

/**
 * O indicador que diz QUEM.
 *
 * "3 pessoas operam sozinhas" é meia informação: sem os nomes, o gestor não
 * consegue pedir ajuda, planejar treinamento nem decidir substituição. Este
 * componente pendura a lista no número.
 *
 * Três formas de abrir, porque hover sozinho exclui metade dos usuários:
 *   - passar o mouse, no desktop;
 *   - clicar ou tocar, em qualquer aparelho, inclusive celular;
 *   - Tab até o gatilho e Enter, no teclado. Esc fecha.
 *
 * O painel não é um modal: não bloqueia a página, não prende o foco e some ao
 * clicar fora. Mostrar cinco nomes não justifica interromper ninguém.
 */
export function Explicacao({
  rotulo,
  titulo,
  children,
  vazio = "ninguém",
  alinhar = "esquerda",
}: {
  /** o que fica visível na linha: normalmente o número e a legenda */
  rotulo: React.ReactNode;
  /** o cabeçalho do painel, dizendo de que lista se trata */
  titulo: string;
  children: React.ReactNode;
  vazio?: string;
  alinhar?: "esquerda" | "direita";
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLSpanElement>(null);
  const idPainel = useId();
  const fechar = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!aberto) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    const aoApontar = (e: PointerEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("pointerdown", aoApontar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("pointerdown", aoApontar);
    };
  }, [aberto]);

  // o atraso ao sair evita que o painel pisque quando o ponteiro atravessa a
  // fresta entre o gatilho e a lista
  function adiarFechamento() {
    if (fechar.current) clearTimeout(fechar.current);
    fechar.current = setTimeout(() => setAberto(false), 120);
  }
  function cancelarFechamento() {
    if (fechar.current) clearTimeout(fechar.current);
    fechar.current = null;
  }

  const temConteudo = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <span
      ref={caixa}
      className="relative inline-flex"
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") {
          cancelarFechamento();
          setAberto(true);
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "touch") adiarFechamento();
      }}
    >
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={aberto ? idPainel : undefined}
        onClick={() => setAberto((a) => !a)}
        onFocus={() => setAberto(true)}
        className="dado inline-flex items-center gap-1.5 rounded-[2px] px-1 py-0.5 transition-colors hover:text-ambar aria-expanded:text-ambar"
      >
        {rotulo}
        <IconeInfo className="h-3.5 w-3.5" />
      </button>

      {aberto && (
        <span
          id={idPainel}
          role="tooltip"
          // Sem sombra de elevação: neste sistema a sombra só descreve um fato
          // físico do material, nunca "está por cima". O fio de contorno e o
          // fundo mais escuro já separam o painel do que está atrás.
          className={`acendendo absolute top-full z-50 mt-1.5 block min-w-[15rem] border border-aco-escuro/60 bg-flap-sombra p-3 ${
            alinhar === "direita" ? "right-0" : "left-0"
          }`}
        >
          <span className="rotulo mb-2 block">{titulo}</span>
          {temConteudo ? (
            <span className="block">{children}</span>
          ) : (
            <span className="conteudo block text-[0.8125rem] text-aco-escuro">
              {vazio}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

/**
 * Uma pessoa dentro do painel da Explicacao.
 *
 * O `nivel` é impresso junto do rótulo porque as colunas do semáforo são
 * CUMULATIVAS: quem está no 4 também é contado no 1, no 2 e no 3. Sem o número,
 * uma tarefa com três pessoas no nível 4 aparece como "3 3 3 3" e a lista de
 * nomes parece contradizer a linha — era exatamente essa a leitura errada.
 *
 * O separador antes de "herdado" é um caractere de verdade, e não margem: a
 * margem some quando alguém copia o texto, e "Consegue fazer e ensinarherdado"
 * foi o resultado.
 */
export function LinhaDePessoa({
  nome,
  nota,
  nivel,
  herdado = false,
}: {
  nome: string;
  nota?: string;
  nivel?: number;
  herdado?: boolean;
}) {
  return (
    <span className="flex items-baseline justify-between gap-4 py-[3px]">
      <span className="conteudo text-[0.8125rem] text-tinta">{nome}</span>
      <span className="rotulo whitespace-nowrap">
        {nivel !== undefined && (
          <span className="dado text-tinta">{`nível ${nivel} · `}</span>
        )}
        {nota}
        {herdado && (
          <span
            className="text-aco-escuro"
            title="nível herdado da virada do mês, ainda não confirmado neste ciclo"
          >
            {" · herdado"}
          </span>
        )}
      </span>
    </span>
  );
}
