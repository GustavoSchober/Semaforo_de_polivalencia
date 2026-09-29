"use client";

import { useSyncExternalStore } from "react";
import { IconeLua, IconeSol } from "./icones";

export type Tema = "escuro" | "claro";

/** A chave é lida por dois lugares: aqui e pelo script anti-piscada do layout. */
export const CHAVE_TEMA = "semaforo:tema";

/**
 * O tema vive no DOM, não no React.
 *
 * O script síncrono do layout já escreveu `data-tema` no `<html>` antes da
 * primeira pintura. Duplicar isso num estado do React criaria duas fontes de
 * verdade e um descompasso de hidratação — o servidor não tem como saber o que
 * está no `localStorage` de quem abriu. `useSyncExternalStore` lê o atributo
 * como o que ele é: estado externo, com um valor declarado para o servidor.
 */
function assinar(aoMudar: () => void) {
  const observador = new MutationObserver(aoMudar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-tema"],
  });
  return () => observador.disconnect();
}

function lerDoDom(): Tema {
  return document.documentElement.getAttribute("data-tema") === "claro"
    ? "claro"
    : "escuro";
}

function lerNoServidor(): Tema {
  return "escuro";
}

/**
 * Claro e escuro.
 *
 * O modo claro foi desenhado como "folha de horários impressa" e o escuro como
 * "painel de partidas" — mas isso é conversa de quem desenhou. Quem usa procura
 * um sol e uma lua, então é isso que o controle diz. O vocabulário do mundo
 * visual vive no DESIGN.md, não na barra de ferramentas.
 *
 * A preferência mora no `localStorage`: não existe back end de usuário enquanto
 * o login não existir (ADR-005), e criar tabela para dado de sessão seria
 * enfiar preferência de interface dentro do modelo de domínio.
 */
export function TrocaDeTema() {
  const tema = useSyncExternalStore(assinar, lerDoDom, lerNoServidor);

  function aplicar(novo: Tema) {
    document.documentElement.setAttribute("data-tema", novo);
    try {
      localStorage.setItem(CHAVE_TEMA, novo);
    } catch {
      // navegação privada ou armazenamento bloqueado: vale para esta sessão e
      // não é lembrado. Degradação aceitável, não erro.
    }
  }

  const opcoes = [
    { valor: "claro" as const, rotulo: "Claro", Icone: IconeSol },
    { valor: "escuro" as const, rotulo: "Escuro", Icone: IconeLua },
  ];

  return (
    <div
      role="group"
      aria-label="Aparência"
      className="flex items-center gap-px border border-current/25 p-px"
    >
      {opcoes.map(({ valor, rotulo, Icone }) => (
        <button
          key={valor}
          type="button"
          title={`Tema ${rotulo.toLowerCase()}`}
          aria-pressed={tema === valor}
          onClick={() => aplicar(valor)}
          className={`rotulo-forte flex items-center gap-1.5 px-2 py-1 text-[0.5625rem] transition-colors ${
            tema === valor
              ? "bg-current/90 text-flap"
              : "text-current opacity-60 hover:opacity-100"
          }`}
        >
          <Icone className="h-3 w-3" />
          {rotulo}
        </button>
      ))}
    </div>
  );
}
