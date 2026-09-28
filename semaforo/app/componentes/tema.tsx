"use client";

import { useSyncExternalStore } from "react";

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
 * A troca entre o painel e a folha impressa.
 *
 * Dois artefatos da mesma estação, não um tema e seu negativo — por isso os
 * rótulos dizem o que cada lado é, em vez de "claro" e "escuro".
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

  const opcoes: { valor: Tema; rotulo: string; titulo: string }[] = [
    { valor: "escuro", rotulo: "Painel", titulo: "Painel de partidas — fundo escuro" },
    {
      valor: "claro",
      rotulo: "Impresso",
      titulo: "Folha de horários — tinta sobre papel",
    },
  ];

  return (
    <div
      role="group"
      aria-label="Aparência"
      className="flex items-center gap-px border border-current/25 p-px"
    >
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          title={o.titulo}
          aria-pressed={tema === o.valor}
          onClick={() => aplicar(o.valor)}
          className={`rotulo-forte px-2 py-1 text-[0.5625rem] transition-colors ${
            tema === o.valor
              ? "bg-current/90 text-flap"
              : "text-current opacity-60 hover:opacity-100"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
