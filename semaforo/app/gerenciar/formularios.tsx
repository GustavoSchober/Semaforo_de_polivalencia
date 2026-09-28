"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { Resultado } from "./actions";

/**
 * O envelope de formulário do cadastro.
 *
 * Toda escrita desta área passa por aqui, então o estado de erro e o de
 * "gravando" existem uma vez só e nenhuma tela reinventa tratamento de falha.
 *
 * Os campos chegam como `children` já renderizados no servidor — e não como
 * função — porque uma função não atravessa a fronteira servidor/cliente. O
 * botão de envio mora aqui dentro, que é onde o estado de pendência existe.
 */
export function Formulario({
  acao,
  children,
  enviar,
  className = "",
}: {
  acao: (fd: FormData) => Promise<Resultado>;
  children: React.ReactNode;
  enviar: string;
  className?: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [gravando, iniciar] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={form}
      className={className}
      action={(fd) => {
        setErro(null);
        iniciar(async () => {
          const r = await acao(fd);
          if (r.ok) {
            form.current?.reset();
            // fecha a gaveta nativa em que o formulário está, quando houver
            form.current?.closest("details")?.removeAttribute("open");
            // `revalidatePath` invalida o cache no servidor, mas a árvore já
            // renderizada no cliente só troca com um refresh explícito — sem
            // ele o cadastro grava e a lista continua mostrando o estado velho
            router.refresh();
          } else {
            setErro(r.erro);
          }
        });
      }}
    >
      {children}
      <button type="submit" className="botao mt-4" disabled={gravando}>
        {gravando ? "Gravando…" : enviar}
      </button>
      {erro && (
        <p
          role="alert"
          className="conteudo mt-3 border-l-2 border-l-vermelho bg-vermelho/12 px-3 py-2 text-[0.8125rem] text-vermelho-tinta"
        >
          {erro}
        </p>
      )}
    </form>
  );
}

/**
 * Uma ação de uma tecla só — desligar, readmitir, desativar tarefa.
 *
 * Pede confirmação quando a consequência é grande. Um `confirm` nativo basta:
 * um modal para "tem certeza?" seria exatamente a interrupção que o piso de
 * craft manda evitar.
 */
export function BotaoDeAcao({
  acao,
  campos,
  confirmar,
  children,
  className = "botao-fantasma",
  title,
}: {
  acao: (fd: FormData) => Promise<Resultado>;
  campos: Record<string, string | number>;
  confirmar?: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [gravando, iniciar] = useTransition();
  const router = useRouter();

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        title={title}
        disabled={gravando}
        className={className}
        onClick={() => {
          if (confirmar && !window.confirm(confirmar)) return;
          const fd = new FormData();
          for (const [k, v] of Object.entries(campos)) fd.set(k, String(v));
          setErro(null);
          iniciar(async () => {
            const r = await acao(fd);
            if (r.ok) router.refresh();
            else setErro(r.erro);
          });
        }}
      >
        {gravando ? "…" : children}
      </button>
      {erro && (
        <span role="alert" className="rotulo normal-case text-vermelho-tinta">
          {erro}
        </span>
      )}
    </span>
  );
}
